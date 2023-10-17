import 'module';

var sjcl = global.sjcl;
sjcl.arrayBuffer = sjcl.arrayBuffer || ({});
sjcl.arrayBuffer.ccm = {
  mode: "ccm",
  defaults: {
    tlen: 128
  },
  compat_encrypt: function (prf, plaintext, iv, adata, tlen) {
    var plaintext_buffer = sjcl.codec.arrayBuffer.fromBits(plaintext, true, 16), ol = sjcl.bitArray.bitLength(plaintext) / 8, encrypted_obj, ct;
    tlen = tlen || 64;
    adata = adata || [];
    encrypted_obj = sjcl.arrayBuffer.ccm.encrypt(prf, plaintext_buffer, iv, adata, tlen, ol);
    ct = sjcl.codec.arrayBuffer.toBits(encrypted_obj.ciphertext_buffer);
    ct = sjcl.bitArray.clamp(ct, ol * 8);
    return sjcl.bitArray.concat(ct, encrypted_obj.tag);
  },
  compat_decrypt: function (prf, ciphertext, iv, adata, tlen) {
    tlen = tlen || 64;
    adata = adata || [];
    var w = sjcl.bitArray, ol = w.bitLength(ciphertext), out = w.clamp(ciphertext, ol - tlen), tag = w.bitSlice(ciphertext, ol - tlen), ciphertext_buffer = sjcl.codec.arrayBuffer.fromBits(out, true, 16);
    var plaintext_buffer = sjcl.arrayBuffer.ccm.decrypt(prf, ciphertext_buffer, iv, tag, adata, tlen, (ol - tlen) / 8);
    return sjcl.bitArray.clamp(sjcl.codec.arrayBuffer.toBits(plaintext_buffer), ol - tlen);
  },
  encrypt: function (prf, plaintext_buffer, iv, adata, tlen, ol) {
    var mac, L, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8;
    adata = adata || [];
    tlen = tlen || sjcl.arrayBuffer.ccm.defaults.tlen;
    ol = ol || plaintext_buffer.byteLength;
    tlen = Math.ceil(tlen / 8);
    for (L = 2; L < 4 && ol >>> 8 * L; L++) {}
    if (L < 15 - ivl) {
      L = 15 - ivl;
    }
    iv = w.clamp(iv, 8 * (15 - L));
    mac = sjcl.arrayBuffer.ccm._computeTag(prf, plaintext_buffer, iv, adata, tlen, ol, L);
    mac = sjcl.arrayBuffer.ccm._ctrMode(prf, plaintext_buffer, iv, mac, tlen, L);
    return {
      "ciphertext_buffer": plaintext_buffer,
      "tag": mac
    };
  },
  decrypt: function (prf, ciphertext_buffer, iv, tag, adata, tlen, ol) {
    var mac, mac2, L, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8;
    adata = adata || [];
    tlen = tlen || sjcl.arrayBuffer.ccm.defaults.tlen;
    ol = ol || ciphertext_buffer.byteLength;
    tlen = Math.ceil(tlen / 8);
    for (L = 2; L < 4 && ol >>> 8 * L; L++) {}
    if (L < 15 - ivl) {
      L = 15 - ivl;
    }
    iv = w.clamp(iv, 8 * (15 - L));
    mac = sjcl.arrayBuffer.ccm._ctrMode(prf, ciphertext_buffer, iv, tag, tlen, L);
    mac2 = sjcl.arrayBuffer.ccm._computeTag(prf, ciphertext_buffer, iv, adata, tlen, ol, L);
    if (!sjcl.bitArray.equal(mac, mac2)) {
      throw new sjcl.exception.corrupt("ccm: tag doesn't match");
    }
    return ciphertext_buffer;
  },
  _computeTag: function (prf, data_buffer, iv, adata, tlen, ol, L) {
    var i, mac, data; sjcl.bitArray;
    mac = sjcl.mode.ccm._macAdditionalData(prf, adata, iv, tlen, ol, L);
    if (data_buffer.byteLength !== 0) {
      data = new DataView(data_buffer);
      for (i = ol; i < data_buffer.byteLength; i++) {
        data.setUint8(i, 0);
      }
      for (i = 0; i < data.byteLength; i += 16) {
        mac[0] ^= data.getUint32(i);
        mac[1] ^= data.getUint32(i + 4);
        mac[2] ^= data.getUint32(i + 8);
        mac[3] ^= data.getUint32(i + 12);
        mac = prf.encrypt(mac);
      }
    }
    return sjcl.bitArray.clamp(mac, tlen * 8);
  },
  _ctrMode: function (prf, data_buffer, iv, mac, tlen, L) {
    var data, ctr, word0, word1, word2, word3, keyblock, i, w = sjcl.bitArray, xor = w._xor4, n = data_buffer.byteLength / 50, p = n;
    ctr = new DataView(new ArrayBuffer(16));
    ctr = w.concat([w.partial(8, L - 1)], iv).concat([0, 0, 0]).slice(0, 4);
    mac = w.bitSlice(xor(mac, prf.encrypt(ctr)), 0, tlen * 8);
    ctr[3]++;
    if (ctr[3] === 0) ctr[2]++;
    if (data_buffer.byteLength !== 0) {
      data = new DataView(data_buffer);
      for (i = 0; i < data.byteLength; i += 16) {
        if (i > n) {
          sjcl.mode.ccm._callProgressListener(i / data_buffer.byteLength);
          n += p;
        }
        keyblock = prf.encrypt(ctr);
        word0 = data.getUint32(i);
        word1 = data.getUint32(i + 4);
        word2 = data.getUint32(i + 8);
        word3 = data.getUint32(i + 12);
        data.setUint32(i, word0 ^ keyblock[0]);
        data.setUint32(i + 4, word1 ^ keyblock[1]);
        data.setUint32(i + 8, word2 ^ keyblock[2]);
        data.setUint32(i + 12, word3 ^ keyblock[3]);
        ctr[3]++;
        if (ctr[3] === 0) ctr[2]++;
      }
    }
    return mac;
  }
};

export { sjcl as default };
