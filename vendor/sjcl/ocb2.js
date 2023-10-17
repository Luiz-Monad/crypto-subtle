import 'module';

var sjcl = global.sjcl;
sjcl.mode.ocb2 = {
  name: "ocb2",
  encrypt: function (prp, plaintext, iv, adata, tlen, premac) {
    if (sjcl.bitArray.bitLength(iv) !== 128) {
      throw new sjcl.exception.invalid("ocb iv must be 128 bits");
    }
    var i, times2 = sjcl.mode.ocb2._times2, w = sjcl.bitArray, xor = w._xor4, checksum = [0, 0, 0, 0], delta = times2(prp.encrypt(iv)), bi, bl, output = [], pad;
    adata = adata || [];
    tlen = tlen || 64;
    for (i = 0; i + 4 < plaintext.length; i += 4) {
      bi = plaintext.slice(i, i + 4);
      checksum = xor(checksum, bi);
      output = output.concat(xor(delta, prp.encrypt(xor(delta, bi))));
      delta = times2(delta);
    }
    bi = plaintext.slice(i);
    bl = w.bitLength(bi);
    pad = prp.encrypt(xor(delta, [0, 0, 0, bl]));
    bi = w.clamp(xor(bi.concat([0, 0, 0]), pad), bl);
    checksum = xor(checksum, xor(bi.concat([0, 0, 0]), pad));
    checksum = prp.encrypt(xor(checksum, xor(delta, times2(delta))));
    if (adata.length) {
      checksum = xor(checksum, premac ? adata : sjcl.mode.ocb2.pmac(prp, adata));
    }
    return output.concat(w.concat(bi, w.clamp(checksum, tlen)));
  },
  decrypt: function (prp, ciphertext, iv, adata, tlen, premac) {
    if (sjcl.bitArray.bitLength(iv) !== 128) {
      throw new sjcl.exception.invalid("ocb iv must be 128 bits");
    }
    tlen = tlen || 64;
    var i, times2 = sjcl.mode.ocb2._times2, w = sjcl.bitArray, xor = w._xor4, checksum = [0, 0, 0, 0], delta = times2(prp.encrypt(iv)), bi, bl, len = sjcl.bitArray.bitLength(ciphertext) - tlen, output = [], pad;
    adata = adata || [];
    for (i = 0; i + 4 < len / 32; i += 4) {
      bi = xor(delta, prp.decrypt(xor(delta, ciphertext.slice(i, i + 4))));
      checksum = xor(checksum, bi);
      output = output.concat(bi);
      delta = times2(delta);
    }
    bl = len - i * 32;
    pad = prp.encrypt(xor(delta, [0, 0, 0, bl]));
    bi = xor(pad, w.clamp(ciphertext.slice(i), bl).concat([0, 0, 0]));
    checksum = xor(checksum, bi);
    checksum = prp.encrypt(xor(checksum, xor(delta, times2(delta))));
    if (adata.length) {
      checksum = xor(checksum, premac ? adata : sjcl.mode.ocb2.pmac(prp, adata));
    }
    if (!w.equal(w.clamp(checksum, tlen), w.bitSlice(ciphertext, len))) {
      throw new sjcl.exception.corrupt("ocb: tag doesn't match");
    }
    return output.concat(w.clamp(bi, bl));
  },
  pmac: function (prp, adata) {
    var i, times2 = sjcl.mode.ocb2._times2, w = sjcl.bitArray, xor = w._xor4, checksum = [0, 0, 0, 0], delta = prp.encrypt([0, 0, 0, 0]), bi;
    delta = xor(delta, times2(times2(delta)));
    for (i = 0; i + 4 < adata.length; i += 4) {
      delta = times2(delta);
      checksum = xor(checksum, prp.encrypt(xor(delta, adata.slice(i, i + 4))));
    }
    bi = adata.slice(i);
    if (w.bitLength(bi) < 128) {
      delta = xor(delta, times2(delta));
      bi = w.concat(bi, [2147483648 | 0, 0, 0, 0]);
    }
    checksum = xor(checksum, bi);
    return prp.encrypt(xor(times2(xor(delta, times2(delta))), checksum));
  },
  _times2: function (x) {
    return [x[0] << 1 ^ x[1] >>> 31, x[1] << 1 ^ x[2] >>> 31, x[2] << 1 ^ x[3] >>> 31, x[3] << 1 ^ (x[0] >>> 31) * 135];
  }
};

export { sjcl as default };
