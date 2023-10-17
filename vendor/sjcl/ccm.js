import 'module';

var sjcl = global.sjcl;
sjcl.mode.ccm = {
  name: "ccm",
  _progressListeners: [],
  listenProgress: function (cb) {
    sjcl.mode.ccm._progressListeners.push(cb);
  },
  unListenProgress: function (cb) {
    var index = sjcl.mode.ccm._progressListeners.indexOf(cb);
    if (index > -1) {
      sjcl.mode.ccm._progressListeners.splice(index, 1);
    }
  },
  _callProgressListener: function (val) {
    var p = sjcl.mode.ccm._progressListeners.slice(), i;
    for (i = 0; i < p.length; i += 1) {
      p[i](val);
    }
  },
  encrypt: function (prf, plaintext, iv, adata, tlen) {
    var L, out = plaintext.slice(0), tag, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8, ol = w.bitLength(out) / 8;
    tlen = tlen || 64;
    adata = adata || [];
    if (ivl < 7) {
      throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");
    }
    for (L = 2; L < 4 && ol >>> 8 * L; L++) {}
    if (L < 15 - ivl) {
      L = 15 - ivl;
    }
    iv = w.clamp(iv, 8 * (15 - L));
    tag = sjcl.mode.ccm._computeTag(prf, plaintext, iv, adata, tlen, L);
    out = sjcl.mode.ccm._ctrMode(prf, out, iv, tag, tlen, L);
    return w.concat(out.data, out.tag);
  },
  decrypt: function (prf, ciphertext, iv, adata, tlen) {
    tlen = tlen || 64;
    adata = adata || [];
    var L, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8, ol = w.bitLength(ciphertext), out = w.clamp(ciphertext, ol - tlen), tag = w.bitSlice(ciphertext, ol - tlen), tag2;
    ol = (ol - tlen) / 8;
    if (ivl < 7) {
      throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");
    }
    for (L = 2; L < 4 && ol >>> 8 * L; L++) {}
    if (L < 15 - ivl) {
      L = 15 - ivl;
    }
    iv = w.clamp(iv, 8 * (15 - L));
    out = sjcl.mode.ccm._ctrMode(prf, out, iv, tag, tlen, L);
    tag2 = sjcl.mode.ccm._computeTag(prf, out.data, iv, adata, tlen, L);
    if (!w.equal(out.tag, tag2)) {
      throw new sjcl.exception.corrupt("ccm: tag doesn't match");
    }
    return out.data;
  },
  _macAdditionalData: function (prf, adata, iv, tlen, ol, L) {
    var mac, tmp, i, macData = [], w = sjcl.bitArray, xor = w._xor4;
    mac = [w.partial(8, (adata.length ? 1 << 6 : 0) | tlen - 2 << 2 | L - 1)];
    mac = w.concat(mac, iv);
    mac[3] |= ol;
    mac = prf.encrypt(mac);
    if (adata.length) {
      tmp = w.bitLength(adata) / 8;
      if (tmp <= 65279) {
        macData = [w.partial(16, tmp)];
      } else if (tmp <= 4294967295) {
        macData = w.concat([w.partial(16, 65534)], [tmp]);
      }
      macData = w.concat(macData, adata);
      for (i = 0; i < macData.length; i += 4) {
        mac = prf.encrypt(xor(mac, macData.slice(i, i + 4).concat([0, 0, 0])));
      }
    }
    return mac;
  },
  _computeTag: function (prf, plaintext, iv, adata, tlen, L) {
    var mac, i, w = sjcl.bitArray, xor = w._xor4;
    tlen /= 8;
    if (tlen % 2 || tlen < 4 || tlen > 16) {
      throw new sjcl.exception.invalid("ccm: invalid tag length");
    }
    if (adata.length > 4294967295 || plaintext.length > 4294967295) {
      throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data");
    }
    mac = sjcl.mode.ccm._macAdditionalData(prf, adata, iv, tlen, w.bitLength(plaintext) / 8, L);
    for (i = 0; i < plaintext.length; i += 4) {
      mac = prf.encrypt(xor(mac, plaintext.slice(i, i + 4).concat([0, 0, 0])));
    }
    return w.clamp(mac, tlen * 8);
  },
  _ctrMode: function (prf, data, iv, tag, tlen, L) {
    var enc, i, w = sjcl.bitArray, xor = w._xor4, ctr, l = data.length, bl = w.bitLength(data), n = l / 50, p = n;
    ctr = w.concat([w.partial(8, L - 1)], iv).concat([0, 0, 0]).slice(0, 4);
    tag = w.bitSlice(xor(tag, prf.encrypt(ctr)), 0, tlen);
    if (!l) {
      return {
        tag: tag,
        data: []
      };
    }
    for (i = 0; i < l; i += 4) {
      if (i > n) {
        sjcl.mode.ccm._callProgressListener(i / l);
        n += p;
      }
      ctr[3]++;
      enc = prf.encrypt(ctr);
      data[i] ^= enc[0];
      data[i + 1] ^= enc[1];
      data[i + 2] ^= enc[2];
      data[i + 3] ^= enc[3];
    }
    return {
      tag: tag,
      data: w.clamp(data, bl)
    };
  }
};

export { sjcl as default };
