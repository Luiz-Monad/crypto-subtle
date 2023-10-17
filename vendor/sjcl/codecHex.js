import 'module';

var sjcl = global.sjcl;
sjcl.codec.hex = {
  fromBits: function (arr) {
    var out = "", i;
    for (i = 0; i < arr.length; i++) {
      out += ((arr[i] | 0) + 263882790666240).toString(16).substr(4);
    }
    return out.substr(0, sjcl.bitArray.bitLength(arr) / 4);
  },
  toBits: function (str) {
    var i, out = [], len;
    str = str.replace(/\s|0x/g, "");
    len = str.length;
    str = str + "00000000";
    for (i = 0; i < str.length; i += 8) {
      out.push(parseInt(str.substr(i, 8), 16) ^ 0);
    }
    return sjcl.bitArray.clamp(out, len * 4);
  }
};

export { sjcl as default };
