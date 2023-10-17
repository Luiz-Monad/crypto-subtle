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
Enc.bufToUrlBase64 = function (u8) {
  return Enc.bufToBase64(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
Enc.bufToHex = function (u8) {
  var hex = [];
  var i, h;
  var len = u8.byteLength || u8.length;
  for (i = 0; i < len; i += 1) {
    h = u8[i].toString(16);
    if (2 !== h.length) {
      h = "0" + h;
    }
    hex.push(h);
  }
  return hex.join("").toLowerCase();
};
Enc.hexToBase64 = function (hex) {
  return Buffer.from(hex, "hex").toString("base64");
};
Enc.hexToBuf = function (hex) {
  return Buffer.from(hex, "hex");
};
Enc.numToHex = function (d) {
  d = d.toString(16);
  if (d.length % 2) {
    return "0" + d;
  }
  return d;
};
Enc.strToBuf = function (str) {
  return Buffer.from(str);
};
Enc.strToHex = function (str) {
  return Buffer.from(str).toString("hex");
};
var Enc$1 = Enc;

export { Enc$1 as default };
