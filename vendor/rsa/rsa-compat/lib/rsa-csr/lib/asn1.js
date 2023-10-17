import 'module';
import Enc from './encoding.js';

var ASN1 = global.ASN1;
var ASN1 = module.exports = function ASN1() {
  var args = Array.prototype.slice.call(arguments);
  var typ = args.shift();
  var str = args.join("").replace(/\s+/g, "").toLowerCase();
  var len = str.length / 2;
  var lenlen = 0;
  var hex = typ;
  if (len !== Math.round(len)) {
    console.error(arguments);
    throw new Error("invalid hex");
  }
  if (len > 127) {
    lenlen += 1;
    while (len > 255) {
      lenlen += 1;
      len = len >> 8;
    }
  }
  if (lenlen) {
    hex += Enc.numToHex(128 + lenlen);
  }
  return hex + Enc.numToHex(str.length / 2) + str;
};
ASN1.UInt = function UINT() {
  var str = Array.prototype.slice.call(arguments).join("");
  var first = parseInt(str.slice(0, 2), 16);
  if (128 & first) {
    str = "00" + str;
  }
  return ASN1("02", str);
};
ASN1.BitStr = function BITSTR() {
  var str = Array.prototype.slice.call(arguments).join("");
  return ASN1("03", "00" + str);
};
var ASN1$1 = ASN1;

export { ASN1$1 as default };
