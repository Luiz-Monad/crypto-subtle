import 'module';
import './hmac.js';
import './md.js';
import './util.js';

var forge = global.forge;
var pkcs5 = forge.pkcs5 = forge.pkcs5 || ({});
var _nodejs = typeof process !== "undefined" && process.versions && process.versions.node;
var crypto;
if (_nodejs && !forge.disableNativeCode) {
  crypto = require("crypto");
}
forge.pbkdf2 = pkcs5.pbkdf2 = function (p, s, c, dkLen, md, callback) {
  if (typeof md === "function") {
    callback = md;
    md = null;
  }
  if (_nodejs && !forge.disableNativeCode && crypto.pbkdf2 && (md === null || typeof md !== "object") && (crypto.pbkdf2Sync.length > 4 || !md || md === "sha1")) {
    if (typeof md !== "string") {
      md = "sha1";
    }
    p = new Buffer(p, "binary");
    s = new Buffer(s, "binary");
    if (!callback) {
      if (crypto.pbkdf2Sync.length === 4) {
        return crypto.pbkdf2Sync(p, s, c, dkLen).toString("binary");
      }
      return crypto.pbkdf2Sync(p, s, c, dkLen, md).toString("binary");
    }
    if (crypto.pbkdf2Sync.length === 4) {
      return crypto.pbkdf2(p, s, c, dkLen, function (err, key) {
        if (err) {
          return callback(err);
        }
        callback(null, key.toString("binary"));
      });
    }
    return crypto.pbkdf2(p, s, c, dkLen, md, function (err, key) {
      if (err) {
        return callback(err);
      }
      callback(null, key.toString("binary"));
    });
  }
  if (typeof md === "undefined" || md === null) {
    md = forge.md.sha1.create();
  }
  if (typeof md === "string") {
    if (!((md in forge.md.algorithms))) {
      throw new Error("Unknown hash algorithm: " + md);
    }
    md = forge.md[md].create();
  }
  var hLen = md.digestLength;
  if (dkLen > 4294967295 * hLen) {
    var err = new Error("Derived key is too long.");
    if (callback) {
      return callback(err);
    }
    throw err;
  }
  var len = Math.ceil(dkLen / hLen);
  var r = dkLen - (len - 1) * hLen;
  var prf = forge.hmac.create();
  prf.start(md, p);
  var dk = "";
  var xor, u_c, u_c1;
  if (!callback) {
    for (var i = 1; i <= len; ++i) {
      prf.start(null, null);
      prf.update(s);
      prf.update(forge.util.int32ToBytes(i));
      xor = u_c1 = prf.digest().getBytes();
      for (var j = 2; j <= c; ++j) {
        prf.start(null, null);
        prf.update(u_c1);
        u_c = prf.digest().getBytes();
        xor = forge.util.xorBytes(xor, u_c, hLen);
        u_c1 = u_c;
      }
      dk += i < len ? xor : xor.substr(0, r);
    }
    return dk;
  }
  var i = 1, j;
  function outer() {
    if (i > len) {
      return callback(null, dk);
    }
    prf.start(null, null);
    prf.update(s);
    prf.update(forge.util.int32ToBytes(i));
    xor = u_c1 = prf.digest().getBytes();
    j = 2;
    inner();
  }
  function inner() {
    if (j <= c) {
      prf.start(null, null);
      prf.update(u_c1);
      u_c = prf.digest().getBytes();
      xor = forge.util.xorBytes(xor, u_c, hLen);
      u_c1 = u_c;
      ++j;
      return forge.util.setImmediate(inner);
    }
    dk += i < len ? xor : xor.substr(0, r);
    ++i;
    outer();
  }
  outer();
};

export { forge as default };
