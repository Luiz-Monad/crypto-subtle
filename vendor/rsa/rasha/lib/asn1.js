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
ASN1.ELOOP = "uASN1.js Error: iterated over 15+ elements (probably a malformed file)";
ASN1.EDEEP = "uASN1.js Error: element nested 20+ layers deep (probably a malformed file)";
ASN1.VTYPES = [2, 3, 5, 6, 12, 130];
ASN1.parse = function parseAsn1(buf, depth, ws) {
  if (!ws) {
    ws = "";
  }
  if (depth >= 20) {
    throw new Error(ASN1.EDEEP);
  }
  var index = 2;
  var asn1 = {
    type: buf[0],
    lengthSize: 0,
    length: buf[1]
  };
  var child;
  var iters = 0;
  var adjust = 0;
  var adjustedLen;
  if (128 & asn1.length) {
    asn1.lengthSize = 127 & asn1.length;
    asn1.length = parseInt(Enc.bufToHex(buf.slice(index, index + asn1.lengthSize)), 16);
    index += asn1.lengthSize;
  }
  if (0 === buf[index] && (2 === asn1.type || 3 === asn1.type)) {
    if (asn1.length > 1) {
      index += 1;
      adjust = -1;
    }
  }
  adjustedLen = asn1.length + adjust;
  if (-1 !== ASN1.VTYPES.indexOf(asn1.type)) {
    asn1.value = buf.slice(index, index + adjustedLen);
    return asn1;
  }
  asn1.children = [];
  while (iters < 15 && index < 2 + asn1.length + asn1.lengthSize) {
    iters += 1;
    child = ASN1.parse(buf.slice(index, index + adjustedLen), (depth || 0) + 1, ws + "  ");
    index += 2 + child.lengthSize + child.length;
    if (index > 2 + asn1.lengthSize + asn1.length) {
      console.error(JSON.stringify(asn1, toPrettyHex, 2));
      throw new Error("Parse error: child value length (" + child.length + ") is greater than remaining parent length (" + (asn1.length - index) + " = " + asn1.length + " - " + index + ")");
    }
    asn1.children.push(child);
  }
  if (index !== 2 + asn1.lengthSize + asn1.length) {
    throw new Error("premature end-of-file (" + "index: " + index + " length: " + (2 + asn1.lengthSize + asn1.length) + ")");
  }
  if (iters >= 15) {
    throw new Error(ASN1.ELOOP);
  }
  return asn1;
};
function toPrettyHex(k, v) {
  if ("value" === k) {
    return "0x" + Enc.bufToHex(v.data);
  }
  return v;
}
ASN1.tpl = function (asn1) {
  var sp = "  ";
  var ws = sp;
  var i = 0;
  var vars = [];
  var str = ws;
  function write(asn1, k) {
    str += "\n" + ws;
    var val;
    if ("number" !== typeof k) ; else {
      str += ", ";
    }
    if (2 === asn1.type) {
      str += "ASN1.UInt(";
    } else if (3 === asn1.type) {
      str += "ASN1.BitStr(";
    } else {
      str += "ASN1('" + Enc.numToHex(asn1.type) + "'";
    }
    if (!asn1.children) {
      if (5 !== asn1.type) {
        if (6 !== asn1.type) {
          val = asn1.value || new Uint8Array(0);
          vars.push("\n// 0x" + Enc.numToHex(val.byteLength) + " (" + val.byteLength + " bytes)\nopts.tpl" + i + " = '" + Enc.bufToHex(val) + "';");
          if (2 !== asn1.type && 3 !== asn1.type) {
            str += ", ";
          }
          str += "Enc.bufToHex(opts.tpl" + i + ")";
        } else {
          str += ", '" + Enc.bufToHex(asn1.value) + "'";
        }
      } else {
        console.warn("XXXXXXXXXXXXXXXXXXXXX");
      }
      str += ")";
      return;
    }
    asn1.children.forEach(function (a, j) {
      i += 1;
      ws += sp;
      write(a, j);
      ws = ws.slice(sp.length);
    });
    str += "\n" + ws + ")";
  }
  write(asn1);
  console.info("var opts = {};");
  console.info(vars.join("\n") + "\n");
  console.info();
  console.info("function buildSchema(opts) {");
  console.info(sp + "return Enc.hexToBuf(" + str.slice(3) + ");");
  console.info("}");
  console.info();
  console.info("buildSchema(opts);");
};
module.exports = ASN1;
var ASN1$1 = ASN1;

export { ASN1$1 as default };
