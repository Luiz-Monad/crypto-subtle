import 'module';

var sjcl = global.sjcl;
sjcl.mode.gcm = {
  name: "gcm",
  encrypt: function (prf, plaintext, iv, adata, tlen) {
    var out, data = plaintext.slice(0), w = sjcl.bitArray;
    tlen = tlen || 128;
    adata = adata || [];
    out = sjcl.mode.gcm._ctrMode(true, prf, data, adata, iv, tlen);
    return w.concat(out.data, out.tag);
  },
  decrypt: function (prf, ciphertext, iv, adata, tlen) {
    var out, data = ciphertext.slice(0), tag, w = sjcl.bitArray, l = w.bitLength(data);
    tlen = tlen || 128;
    adata = adata || [];
    if (tlen <= l) {
      tag = w.bitSlice(data, l - tlen);
      data = w.bitSlice(data, 0, l - tlen);
    } else {
      tag = data;
      data = [];
    }
    out = sjcl.mode.gcm._ctrMode(false, prf, data, adata, iv, tlen);
    if (!w.equal(out.tag, tag)) {
      throw new sjcl.exception.corrupt("gcm: tag doesn't match");
    }
    return out.data;
  },
  _galoisMultiply: function (x, y) {
    var i, j, xi, Zi, Vi, lsb_Vi, w = sjcl.bitArray, xor = w._xor4;
    Zi = [0, 0, 0, 0];
    Vi = y.slice(0);
    for (i = 0; i < 128; i++) {
      xi = (x[Math.floor(i / 32)] & 1 << 31 - i % 32) !== 0;
      if (xi) {
        Zi = xor(Zi, Vi);
      }
      lsb_Vi = (Vi[3] & 1) !== 0;
      for (j = 3; j > 0; j--) {
        Vi[j] = Vi[j] >>> 1 | (Vi[j - 1] & 1) << 31;
      }
      Vi[0] = Vi[0] >>> 1;
      if (lsb_Vi) {
        Vi[0] = Vi[0] ^ 225 << 24;
      }
    }
    return Zi;
  },
  _ghash: function (H, Y0, data) {
    var Yi, i, l = data.length;
    Yi = Y0.slice(0);
    for (i = 0; i < l; i += 4) {
      Yi[0] ^= 4294967295 & data[i];
      Yi[1] ^= 4294967295 & data[i + 1];
      Yi[2] ^= 4294967295 & data[i + 2];
      Yi[3] ^= 4294967295 & data[i + 3];
      Yi = sjcl.mode.gcm._galoisMultiply(Yi, H);
    }
    return Yi;
  },
  _ctrMode: function (encrypt, prf, data, adata, iv, tlen) {
    var H, J0, S0, enc, i, ctr, tag, last, l, bl, abl, ivbl, w = sjcl.bitArray;
    l = data.length;
    bl = w.bitLength(data);
    abl = w.bitLength(adata);
    ivbl = w.bitLength(iv);
    H = prf.encrypt([0, 0, 0, 0]);
    if (ivbl === 96) {
      J0 = iv.slice(0);
      J0 = w.concat(J0, [1]);
    } else {
      J0 = sjcl.mode.gcm._ghash(H, [0, 0, 0, 0], iv);
      J0 = sjcl.mode.gcm._ghash(H, J0, [0, 0, Math.floor(ivbl / 4294967296), ivbl & 4294967295]);
    }
    S0 = sjcl.mode.gcm._ghash(H, [0, 0, 0, 0], adata);
    ctr = J0.slice(0);
    tag = S0.slice(0);
    if (!encrypt) {
      tag = sjcl.mode.gcm._ghash(H, S0, data);
    }
    for (i = 0; i < l; i += 4) {
      ctr[3]++;
      enc = prf.encrypt(ctr);
      data[i] ^= enc[0];
      data[i + 1] ^= enc[1];
      data[i + 2] ^= enc[2];
      data[i + 3] ^= enc[3];
    }
    data = w.clamp(data, bl);
    if (encrypt) {
      tag = sjcl.mode.gcm._ghash(H, S0, data);
    }
    last = [Math.floor(abl / 4294967296), abl & 4294967295, Math.floor(bl / 4294967296), bl & 4294967295];
    tag = sjcl.mode.gcm._ghash(H, tag, last);
    enc = prf.encrypt(J0);
    tag[0] ^= enc[0];
    tag[1] ^= enc[1];
    tag[2] ^= enc[2];
    tag[3] ^= enc[3];
    return {
      tag: w.bitSlice(tag, 0, tlen),
      data: data
    };
  }
};

export { sjcl as default };
