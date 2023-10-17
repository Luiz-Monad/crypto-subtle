import 'module';

var sjcl = global.sjcl;
if (sjcl.beware === undefined) {
  sjcl.beware = {};
}
sjcl.beware["CTR mode is dangerous because it doesn't protect message integrity."] = function () {
  sjcl.mode.ctr = {
    name: "ctr",
    encrypt: function (prf, plaintext, iv, adata) {
      return sjcl.mode.ctr._calculate(prf, plaintext, iv, adata);
    },
    decrypt: function (prf, ciphertext, iv, adata) {
      return sjcl.mode.ctr._calculate(prf, ciphertext, iv, adata);
    },
    _calculate: function (prf, data, iv, adata) {
      var l, bl, c, d, e, i;
      if (adata && adata.length) {
        throw new sjcl.exception.invalid("ctr can't authenticate data");
      }
      if (sjcl.bitArray.bitLength(iv) !== 128) {
        throw new sjcl.exception.invalid("ctr iv must be 128 bits");
      }
      if (!(l = data.length)) {
        return [];
      }
      c = iv.slice(0);
      d = data.slice(0);
      bl = sjcl.bitArray.bitLength(d);
      for (i = 0; i < l; i += 4) {
        e = prf.encrypt(c);
        d[i] ^= e[0];
        d[i + 1] ^= e[1];
        d[i + 2] ^= e[2];
        d[i + 3] ^= e[3];
        c[3]++;
      }
      return sjcl.bitArray.clamp(d, bl);
    }
  };
};

export { sjcl as default };
