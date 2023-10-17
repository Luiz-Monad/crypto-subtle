import 'module';

var sjcl = global.sjcl;
sjcl.mode.ocb2progressive = {
  createEncryptor: function (prp, iv, adata, tlen, premac) {
    if (sjcl.bitArray.bitLength(iv) !== 128) {
      throw new sjcl.exception.invalid("ocb iv must be 128 bits");
    }
    var i, times2 = sjcl.mode.ocb2._times2, w = sjcl.bitArray, xor = w._xor4, checksum = [0, 0, 0, 0], delta = times2(prp.encrypt(iv)), bi, bl, datacache = [], pad;
    adata = adata || [];
    tlen = tlen || 64;
    return {
      process: function (data) {
        var datalen = sjcl.bitArray.bitLength(data);
        if (datalen == 0) {
          return [];
        }
        var output = [];
        datacache = datacache.concat(data);
        for (i = 0; i + 4 < datacache.length; i += 4) {
          bi = datacache.slice(i, i + 4);
          checksum = xor(checksum, bi);
          output = output.concat(xor(delta, prp.encrypt(xor(delta, bi))));
          delta = times2(delta);
        }
        datacache = datacache.slice(i);
        return output;
      },
      finalize: function () {
        bi = datacache;
        bl = w.bitLength(bi);
        pad = prp.encrypt(xor(delta, [0, 0, 0, bl]));
        bi = w.clamp(xor(bi.concat([0, 0, 0]), pad), bl);
        checksum = xor(checksum, xor(bi.concat([0, 0, 0]), pad));
        checksum = prp.encrypt(xor(checksum, xor(delta, times2(delta))));
        if (adata.length) {
          checksum = xor(checksum, premac ? adata : sjcl.mode.ocb2.pmac(prp, adata));
        }
        return w.concat(bi, w.clamp(checksum, tlen));
      }
    };
  },
  createDecryptor: function (prp, iv, adata, tlen, premac) {
    if (sjcl.bitArray.bitLength(iv) !== 128) {
      throw new sjcl.exception.invalid("ocb iv must be 128 bits");
    }
    tlen = tlen || 64;
    var i, times2 = sjcl.mode.ocb2._times2, w = sjcl.bitArray, xor = w._xor4, checksum = [0, 0, 0, 0], delta = times2(prp.encrypt(iv)), bi, bl, datacache = [], pad;
    adata = adata || [];
    return {
      process: function (data) {
        if (data.length == 0) {
          return [];
        }
        var output = [];
        datacache = datacache.concat(data);
        var cachelen = sjcl.bitArray.bitLength(datacache);
        for (i = 0; i + 4 < (cachelen - tlen) / 32; i += 4) {
          bi = xor(delta, prp.decrypt(xor(delta, datacache.slice(i, i + 4))));
          checksum = xor(checksum, bi);
          output = output.concat(bi);
          delta = times2(delta);
        }
        datacache = datacache.slice(i);
        return output;
      },
      finalize: function () {
        bl = sjcl.bitArray.bitLength(datacache) - tlen;
        pad = prp.encrypt(xor(delta, [0, 0, 0, bl]));
        bi = xor(pad, w.clamp(datacache, bl).concat([0, 0, 0]));
        checksum = xor(checksum, bi);
        checksum = prp.encrypt(xor(checksum, xor(delta, times2(delta))));
        if (adata.length) {
          checksum = xor(checksum, premac ? adata : sjcl.mode.ocb2.pmac(prp, adata));
        }
        if (!w.equal(w.clamp(checksum, tlen), w.bitSlice(datacache, bl))) {
          throw new sjcl.exception.corrupt("ocb: tag doesn't match");
        }
        return w.clamp(bi, bl);
      }
    };
  }
};

export { sjcl as default };
