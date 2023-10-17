import 'module';

var sjcl = global.sjcl;
sjcl.codec.arrayBuffer = {
  fromBits: function (arr, padding, padding_count) {
    var out, i, ol, tmp, smallest;
    padding = padding == undefined ? true : padding;
    padding_count = padding_count || 8;
    if (arr.length === 0) {
      return new ArrayBuffer(0);
    }
    ol = sjcl.bitArray.bitLength(arr) / 8;
    if (sjcl.bitArray.bitLength(arr) % 8 !== 0) {
      throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly");
    }
    if (padding && ol % padding_count !== 0) {
      ol += padding_count - ol % padding_count;
    }
    tmp = new DataView(new ArrayBuffer(arr.length * 4));
    for (i = 0; i < arr.length; i++) {
      tmp.setUint32(i * 4, arr[i] << 32);
    }
    out = new DataView(new ArrayBuffer(ol));
    if (out.byteLength === tmp.byteLength) {
      return tmp.buffer;
    }
    smallest = tmp.byteLength < out.byteLength ? tmp.byteLength : out.byteLength;
    for (i = 0; i < smallest; i++) {
      out.setUint8(i, tmp.getUint8(i));
    }
    return out.buffer;
  },
  toBits: function (buffer) {
    var i, out = [], len, inView, tmp;
    if (buffer.byteLength === 0) {
      return [];
    }
    inView = new DataView(buffer);
    len = inView.byteLength - inView.byteLength % 4;
    for (var i = 0; i < len; i += 4) {
      out.push(inView.getUint32(i));
    }
    if (inView.byteLength % 4 != 0) {
      tmp = new DataView(new ArrayBuffer(4));
      for (var i = 0, l = inView.byteLength % 4; i < l; i++) {
        tmp.setUint8(i + 4 - l, inView.getUint8(len + i));
      }
      out.push(sjcl.bitArray.partial(inView.byteLength % 4 * 8, tmp.getUint32(0)));
    }
    return out;
  },
  hexDumpBuffer: function (buffer) {
    var stringBufferView = new DataView(buffer);
    var string = "";
    var pad = function (n, width) {
      n = n + "";
      return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
    };
    for (var i = 0; i < stringBufferView.byteLength; i += 2) {
      if (i % 16 == 0) string += "\n" + i.toString(16) + "\t";
      string += pad(stringBufferView.getUint16(i).toString(16), 4) + " ";
    }
    if (typeof console === undefined) {
      console = console || ({
        log: function () {}
      });
    }
    console.log(string.toUpperCase());
  }
};

export { sjcl as default };
