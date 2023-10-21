import require$$0 from './_virtual/sjcl.js';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var sjcl = require$$0;
var codec = sjcl.codec = sjcl.codec || {};
var bitArray = sjcl.bitArray;
/** @fileOverview Bit array codec implementations.
 *
 * @author Marco Munizaga
 */

//patch arraybuffers if they don't exist

/**
 * ArrayBuffer
 * @namespace
 */
codec.arrayBuffer = {
  /** Convert from a bitArray to an ArrayBuffer. 
   * Will default to 8byte padding if padding is undefined*/
  fromBits: function fromBits(arr, padding, padding_count) {
    var out, i, ol, tmp, smallest;
    padding = padding == undefined ? true : padding;
    padding_count = padding_count || 8;
    if (arr.length === 0) {
      return new ArrayBuffer(0);
    }
    ol = bitArray.bitLength(arr) / 8;

    //check to make sure the bitLength is divisible by 8, if it isn't 
    //we can't do anything since arraybuffers work with bytes, not bits
    if (sjcl.bitArray.bitLength(arr) % 8 !== 0) {
      throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly");
    }
    if (padding && ol % padding_count !== 0) {
      ol += padding_count - ol % padding_count;
    }

    //padded temp for easy copying
    tmp = new DataView(new ArrayBuffer(arr.length * 4));
    for (i = 0; i < arr.length; i++) {
      tmp.setUint32(i * 4, arr[i] << 32); //get rid of the higher bits
    }

    //now copy the final message if we are not going to 0 pad
    out = new DataView(new ArrayBuffer(ol));

    //save a step when the tmp and out bytelength are ===
    if (out.byteLength === tmp.byteLength) {
      return tmp.buffer;
    }
    smallest = tmp.byteLength < out.byteLength ? tmp.byteLength : out.byteLength;
    for (i = 0; i < smallest; i++) {
      out.setUint8(i, tmp.getUint8(i));
    }
    return out.buffer;
  },
  /** Convert from an ArrayBuffer to a bitArray. */
  toBits: function toBits(buffer) {
    var i,
      out = [],
      len,
      inView,
      tmp;
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
        //we want the data to the right, because partial slices off the starting bits
        tmp.setUint8(i + 4 - l, inView.getUint8(len + i)); // big-endian, 
      }

      out.push(bitArray.partial(inView.byteLength % 4 * 8, tmp.getUint32(0)));
    }
    return out;
  },
  /** Prints a hex output of the buffer contents, akin to hexdump **/
  hexDumpBuffer: function hexDumpBuffer(buffer) {
    var stringBufferView = new DataView(buffer);
    var string = '';
    var pad = function pad(n, width) {
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    };
    for (var i = 0; i < stringBufferView.byteLength; i += 2) {
      if (i % 16 == 0) string += '\n' + i.toString(16) + '\t';
      string += pad(stringBufferView.getUint16(i).toString(16), 4) + ' ';
    }
    if ((typeof console === "undefined" ? "undefined" : _typeof(console)) === undefined) {
      console = console || {
        log: function log() {}
      }; //fix for IE
    }

    console.log(string.toUpperCase());
  }
};
