import 'module';

var sjcl = global.sjcl;
sjcl.codec.z85 = {
  _chars: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#",
  _byteMap: [0, 68, 0, 84, 83, 82, 72, 0, 75, 76, 70, 65, 0, 63, 62, 69, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 64, 0, 73, 66, 74, 71, 81, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 77, 0, 78, 67, 0, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 79, 0, 80, 0, 0],
  fromBits: function (arr) {
    if (!arr) {
      return null;
    }
    if (0 !== sjcl.bitArray.bitLength(arr) % 32) {
      throw new sjcl.exception.invalid("Invalid bitArray length!");
    }
    var out = "", c = sjcl.codec.z85._chars;
    for (var i = 0; i < arr.length; ++i) {
      var word = arr[i];
      var value = 0;
      for (var j = 0; j < 4; ++j) {
        var byteChunk = word >>> 8 * (4 - j - 1) & 255;
        value = value * 256 + byteChunk;
      }
      var divisor = 85 * 85 * 85 * 85;
      while (divisor) {
        out += c.charAt(Math.floor(value / divisor) % 85);
        divisor = Math.floor(divisor / 85);
      }
    }
    var encodedSize = arr.length * 5;
    if (out.length !== encodedSize) {
      throw new sjcl.exception.invalid("Bad Z85 conversion!");
    }
    return out;
  },
  toBits: function (str) {
    if (!str) {
      return [];
    }
    if (0 !== str.length % 5) {
      throw new sjcl.exception.invalid("Invalid Z85 string!");
    }
    var out = [], value = 0, byteMap = sjcl.codec.z85._byteMap;
    var word = 0, wordSize = 0;
    for (var i = 0; i < str.length; ) {
      value = value * 85 + byteMap[str[i++].charCodeAt(0) - 32];
      if (0 === i % 5) {
        var divisor = 256 * 256 * 256;
        while (divisor) {
          word = word * Math.pow(2, 8) + Math.floor(value / divisor) % 256;
          ++wordSize;
          if (4 === wordSize) {
            out.push(word);
            (word = 0, wordSize = 0);
          }
          divisor = Math.floor(divisor / 256);
        }
        value = 0;
      }
    }
    return out;
  }
};

export { sjcl as default };
