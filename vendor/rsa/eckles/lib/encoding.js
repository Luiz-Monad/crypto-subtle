import 'module';

var Enc = global.Enc;
var Enc = module.exports;
Enc.base64ToBuf = function (str) {
  return Buffer.from(str, "base64");
};
Enc.base64ToHex = function (b64) {
  return Enc.bufToHex(Enc.base64ToBuf(b64));
};
Enc.bufToBase64 = function (u8) {
  return Buffer.from(u8).toString("base64");
};
Enc.bufToHex = function (u8) {
  return Buffer.from(u8).toString("hex");
};
Enc.bufToUrlBase64 = function (u8) {
  return Enc.bufToBase64(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
Enc.hexToUint8 = function (hex) {
  var buf = Buffer.from(hex, "hex");
  var ab = buf.buffer.slice(buf.offset, buf.offset + buf.byteLength);
  return new Uint8Array(ab);
};
Enc.numToHex = function (d) {
  d = d.toString(16);
  if (d.length % 2) {
    return "0" + d;
  }
  return d;
};
var Enc$1 = Enc;

export { Enc$1 as default };
