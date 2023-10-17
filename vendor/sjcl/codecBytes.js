import 'module';

var sjcl = global.sjcl;
sjcl.codec.bytes = {
  fromBits: function (arr) {
    var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
    for (i = 0; i < bl / 8; i++) {
      if ((i & 3) === 0) {
        tmp = arr[i / 4];
      }
      out.push(tmp >>> 24);
      tmp <<= 8;
    }
    return out;
  },
  toBits: function (bytes) {
    var out = [], i, tmp = 0;
    for (i = 0; i < bytes.length; i++) {
      tmp = tmp << 8 | bytes[i];
      if ((i & 3) === 3) {
        out.push(tmp);
        tmp = 0;
      }
    }
    if (i & 3) {
      out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
    }
    return out;
  }
};

export { sjcl as default };
