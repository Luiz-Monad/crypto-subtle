import 'module';

var sjcl = global.sjcl;
if (sjcl.beware === undefined) {
  sjcl.beware = {};
}
sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."] = function () {
  sjcl.mode.cbc = {
    name: "cbc",
    encrypt: function (prp, plaintext, iv, adata) {
      if (adata && adata.length) {
        throw new sjcl.exception.invalid("cbc can't authenticate data");
      }
      if (sjcl.bitArray.bitLength(iv) !== 128) {
        throw new sjcl.exception.invalid("cbc iv must be 128 bits");
      }
      var i, w = sjcl.bitArray, xor = w._xor4, bl = w.bitLength(plaintext), bp = 0, output = [];
      if (bl & 7) {
        throw new sjcl.exception.invalid("pkcs#5 padding only works for multiples of a byte");
      }
      for (i = 0; bp + 128 <= bl; (i += 4, bp += 128)) {
        iv = prp.encrypt(xor(iv, plaintext.slice(i, i + 4)));
        output.splice(i, 0, iv[0], iv[1], iv[2], iv[3]);
      }
      bl = (16 - (bl >> 3 & 15)) * 16843009;
      iv = prp.encrypt(xor(iv, w.concat(plaintext, [bl, bl, bl, bl]).slice(i, i + 4)));
      output.splice(i, 0, iv[0], iv[1], iv[2], iv[3]);
      return output;
    },
    decrypt: function (prp, ciphertext, iv, adata) {
      if (adata && adata.length) {
        throw new sjcl.exception.invalid("cbc can't authenticate data");
      }
      if (sjcl.bitArray.bitLength(iv) !== 128) {
        throw new sjcl.exception.invalid("cbc iv must be 128 bits");
      }
      if (sjcl.bitArray.bitLength(ciphertext) & 127 || !ciphertext.length) {
        throw new sjcl.exception.corrupt("cbc ciphertext must be a positive multiple of the block size");
      }
      var i, w = sjcl.bitArray, xor = w._xor4, bi, bo, output = [];
      adata = adata || [];
      for (i = 0; i < ciphertext.length; i += 4) {
        bi = ciphertext.slice(i, i + 4);
        bo = xor(iv, prp.decrypt(bi));
        output.splice(i, 0, bo[0], bo[1], bo[2], bo[3]);
        iv = bi;
      }
      bi = output[i - 1] & 255;
      if (bi === 0 || bi > 16) {
        throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
      }
      bo = bi * 16843009;
      if (!w.equal(w.bitSlice([bo, bo, bo, bo], 0, bi * 8), w.bitSlice(output, output.length * 32 - bi * 8, output.length * 32))) {
        throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
      }
      return w.bitSlice(output, 0, output.length * 32 - bi * 8);
    }
  };
};

export { sjcl as default };
