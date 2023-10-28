import 'module';
import './util.js';
import './random.js';
import './sha1.js';

var forge = global.forge;
var pkcs1 = forge.pkcs1 = forge.pkcs1 || ({});
pkcs1.encode_rsa_oaep = function (key, message, options) {
  var label;
  var seed;
  var md;
  var mgf1Md;
  if (typeof options === "string") {
    label = options;
    seed = arguments[3] || undefined;
    md = arguments[4] || undefined;
  } else if (options) {
    label = options.label || undefined;
    seed = options.seed || undefined;
    md = options.md || undefined;
    if (options.mgf1 && options.mgf1.md) {
      mgf1Md = options.mgf1.md;
    }
  }
  if (!md) {
    md = forge.md.sha1.create();
  } else {
    md.start();
  }
  if (!mgf1Md) {
    mgf1Md = md;
  }
  var keyLength = Math.ceil(key.n.bitLength() / 8);
  var maxLength = keyLength - 2 * md.digestLength - 2;
  if (message.length > maxLength) {
    var error = new Error("RSAES-OAEP input message length is too long.");
    error.length = message.length;
    error.maxLength = maxLength;
    throw error;
  }
  if (!label) {
    label = "";
  }
  md.update(label, "raw");
  var lHash = md.digest();
  var PS = "";
  var PS_length = maxLength - message.length;
  for (var i = 0; i < PS_length; i++) {
    PS += "\u0000";
  }
  var DB = lHash.getBytes() + PS + "\u0001" + message;
  if (!seed) {
    seed = forge.random.getBytes(md.digestLength);
  } else if (seed.length !== md.digestLength) {
    var error = new Error("Invalid RSAES-OAEP seed. The seed length must " + "match the digest length.");
    error.seedLength = seed.length;
    error.digestLength = md.digestLength;
    throw error;
  }
  var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
  var maskedDB = forge.util.xorBytes(DB, dbMask, DB.length);
  var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
  var maskedSeed = forge.util.xorBytes(seed, seedMask, seed.length);
  return "\u0000" + maskedSeed + maskedDB;
};
pkcs1.decode_rsa_oaep = function (key, em, options) {
  var label;
  var md;
  var mgf1Md;
  if (typeof options === "string") {
    label = options;
    md = arguments[3] || undefined;
  } else if (options) {
    label = options.label || undefined;
    md = options.md || undefined;
    if (options.mgf1 && options.mgf1.md) {
      mgf1Md = options.mgf1.md;
    }
  }
  var keyLength = Math.ceil(key.n.bitLength() / 8);
  if (em.length !== keyLength) {
    var error = new Error("RSAES-OAEP encoded message length is invalid.");
    error.length = em.length;
    error.expectedLength = keyLength;
    throw error;
  }
  if (md === undefined) {
    md = forge.md.sha1.create();
  } else {
    md.start();
  }
  if (!mgf1Md) {
    mgf1Md = md;
  }
  if (keyLength < 2 * md.digestLength + 2) {
    throw new Error("RSAES-OAEP key is too short for the hash function.");
  }
  if (!label) {
    label = "";
  }
  md.update(label, "raw");
  var lHash = md.digest().getBytes();
  var y = em.charAt(0);
  var maskedSeed = em.substring(1, md.digestLength + 1);
  var maskedDB = em.substring(1 + md.digestLength);
  var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
  var seed = forge.util.xorBytes(maskedSeed, seedMask, maskedSeed.length);
  var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
  var db = forge.util.xorBytes(maskedDB, dbMask, maskedDB.length);
  var lHashPrime = db.substring(0, md.digestLength);
  var error = y !== "\u0000";
  for (var i = 0; i < md.digestLength; ++i) {
    error |= lHash.charAt(i) !== lHashPrime.charAt(i);
  }
  var in_ps = 1;
  var index = md.digestLength;
  for (var j = md.digestLength; j < db.length; j++) {
    var code = db.charCodeAt(j);
    var is_0 = code & 1 ^ 1;
    var error_mask = in_ps ? 65534 : 0;
    error |= code & error_mask;
    in_ps = in_ps & is_0;
    index += in_ps;
  }
  if (error || db.charCodeAt(index) !== 1) {
    throw new Error("Invalid RSAES-OAEP padding.");
  }
  return db.substring(index + 1);
};
function rsa_mgf1(seed, maskLength, hash) {
  if (!hash) {
    hash = forge.md.sha1.create();
  }
  var t = "";
  var count = Math.ceil(maskLength / hash.digestLength);
  for (var i = 0; i < count; ++i) {
    var c = String.fromCharCode(i >> 24 & 255, i >> 16 & 255, i >> 8 & 255, i & 255);
    hash.start();
    hash.update(seed + c);
    t += hash.digest().getBytes();
  }
  return t.substring(0, maskLength);
}

export { forge as default };
