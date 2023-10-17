import 'module';

var sjcl = global.sjcl;
sjcl.json = {
  defaults: {
    v: 1,
    iter: 10000,
    ks: 128,
    ts: 64,
    mode: "ccm",
    adata: "",
    cipher: "aes"
  },
  _encrypt: function (password, plaintext, params, rp) {
    params = params || ({});
    rp = rp || ({});
    var j = sjcl.json, p = j._add({
      iv: sjcl.random.randomWords(4, 0)
    }, j.defaults), tmp, prp, adata;
    j._add(p, params);
    adata = p.adata;
    if (typeof p.salt === "string") {
      p.salt = sjcl.codec.base64.toBits(p.salt);
    }
    if (typeof p.iv === "string") {
      p.iv = sjcl.codec.base64.toBits(p.iv);
    }
    if (!sjcl.mode[p.mode] || !sjcl.cipher[p.cipher] || typeof password === "string" && p.iter <= 100 || p.ts !== 64 && p.ts !== 96 && p.ts !== 128 || p.ks !== 128 && p.ks !== 192 && p.ks !== 256 || p.iv.length < 2 || p.iv.length > 4) {
      throw new sjcl.exception.invalid("json encrypt: invalid parameters");
    }
    if (typeof password === "string") {
      tmp = sjcl.misc.cachedPbkdf2(password, p);
      password = tmp.key.slice(0, p.ks / 32);
      p.salt = tmp.salt;
    } else if (sjcl.ecc && password instanceof sjcl.ecc.elGamal.publicKey) {
      tmp = password.kem();
      p.kemtag = tmp.tag;
      password = tmp.key.slice(0, p.ks / 32);
    }
    if (typeof plaintext === "string") {
      plaintext = sjcl.codec.utf8String.toBits(plaintext);
    }
    if (typeof adata === "string") {
      p.adata = adata = sjcl.codec.utf8String.toBits(adata);
    }
    prp = new sjcl.cipher[p.cipher](password);
    j._add(rp, p);
    rp.key = password;
    if (p.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && plaintext instanceof ArrayBuffer) {
      p.ct = sjcl.arrayBuffer.ccm.encrypt(prp, plaintext, p.iv, adata, p.ts);
    } else {
      p.ct = sjcl.mode[p.mode].encrypt(prp, plaintext, p.iv, adata, p.ts);
    }
    return p;
  },
  encrypt: function (password, plaintext, params, rp) {
    var j = sjcl.json, p = j._encrypt.apply(j, arguments);
    return j.encode(p);
  },
  _decrypt: function (password, ciphertext, params, rp) {
    params = params || ({});
    rp = rp || ({});
    var j = sjcl.json, p = j._add(j._add(j._add({}, j.defaults), ciphertext), params, true), ct, tmp, prp, adata = p.adata;
    if (typeof p.salt === "string") {
      p.salt = sjcl.codec.base64.toBits(p.salt);
    }
    if (typeof p.iv === "string") {
      p.iv = sjcl.codec.base64.toBits(p.iv);
    }
    if (!sjcl.mode[p.mode] || !sjcl.cipher[p.cipher] || typeof password === "string" && p.iter <= 100 || p.ts !== 64 && p.ts !== 96 && p.ts !== 128 || p.ks !== 128 && p.ks !== 192 && p.ks !== 256 || !p.iv || p.iv.length < 2 || p.iv.length > 4) {
      throw new sjcl.exception.invalid("json decrypt: invalid parameters");
    }
    if (typeof password === "string") {
      tmp = sjcl.misc.cachedPbkdf2(password, p);
      password = tmp.key.slice(0, p.ks / 32);
      p.salt = tmp.salt;
    } else if (sjcl.ecc && password instanceof sjcl.ecc.elGamal.secretKey) {
      password = password.unkem(sjcl.codec.base64.toBits(p.kemtag)).slice(0, p.ks / 32);
    }
    if (typeof adata === "string") {
      adata = sjcl.codec.utf8String.toBits(adata);
    }
    prp = new sjcl.cipher[p.cipher](password);
    if (p.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && p.ct instanceof ArrayBuffer) {
      ct = sjcl.arrayBuffer.ccm.decrypt(prp, p.ct, p.iv, p.tag, adata, p.ts);
    } else {
      ct = sjcl.mode[p.mode].decrypt(prp, p.ct, p.iv, adata, p.ts);
    }
    j._add(rp, p);
    rp.key = password;
    if (params.raw === 1) {
      return ct;
    } else {
      return sjcl.codec.utf8String.fromBits(ct);
    }
  },
  decrypt: function (password, ciphertext, params, rp) {
    var j = sjcl.json;
    return j._decrypt(password, j.decode(ciphertext), params, rp);
  },
  encode: function (obj) {
    var i, out = "{", comma = "";
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (!i.match(/^[a-z0-9]+$/i)) {
          throw new sjcl.exception.invalid("json encode: invalid property name");
        }
        out += comma + "\"" + i + "\":";
        comma = ",";
        switch (typeof obj[i]) {
          case "number":
          case "boolean":
            out += obj[i];
            break;
          case "string":
            out += "\"" + escape(obj[i]) + "\"";
            break;
          case "object":
            out += "\"" + sjcl.codec.base64.fromBits(obj[i], 0) + "\"";
            break;
          default:
            throw new sjcl.exception.bug("json encode: unsupported type");
        }
      }
    }
    return out + "}";
  },
  decode: function (str) {
    str = str.replace(/\s/g, "");
    if (!str.match(/^\{.*\}$/)) {
      throw new sjcl.exception.invalid("json decode: this isn't json!");
    }
    var a = str.replace(/^\{|\}$/g, "").split(/,/), out = {}, i, m;
    for (i = 0; i < a.length; i++) {
      if (!(m = a[i].match(/^\s*(?:(["']?)([a-z][a-z0-9]*)\1)\s*:\s*(?:(-?\d+)|"([a-z0-9+\/%*_.@=\-]*)"|(true|false))$/i))) {
        throw new sjcl.exception.invalid("json decode: this isn't json!");
      }
      if (m[3] != null) {
        out[m[2]] = parseInt(m[3], 10);
      } else if (m[4] != null) {
        out[m[2]] = m[2].match(/^(ct|adata|salt|iv)$/) ? sjcl.codec.base64.toBits(m[4]) : unescape(m[4]);
      } else if (m[5] != null) {
        out[m[2]] = m[5] === "true";
      }
    }
    return out;
  },
  _add: function (target, src, requireSame) {
    if (target === undefined) {
      target = {};
    }
    if (src === undefined) {
      return target;
    }
    var i;
    for (i in src) {
      if (src.hasOwnProperty(i)) {
        if (requireSame && target[i] !== undefined && target[i] !== src[i]) {
          throw new sjcl.exception.invalid("required parameter overridden");
        }
        target[i] = src[i];
      }
    }
    return target;
  },
  _subtract: function (plus, minus) {
    var out = {}, i;
    for (i in plus) {
      if (plus.hasOwnProperty(i) && plus[i] !== minus[i]) {
        out[i] = plus[i];
      }
    }
    return out;
  },
  _filter: function (src, filter) {
    var out = {}, i;
    for (i = 0; i < filter.length; i++) {
      if (src[filter[i]] !== undefined) {
        out[filter[i]] = src[filter[i]];
      }
    }
    return out;
  }
};
sjcl.encrypt = sjcl.json.encrypt;
sjcl.decrypt = sjcl.json.decrypt;
sjcl.misc._pbkdf2Cache = {};
sjcl.misc.cachedPbkdf2 = function (password, obj) {
  var cache = sjcl.misc._pbkdf2Cache, c, cp, salt, iter;
  obj = obj || ({});
  iter = obj.iter || 1000;
  cp = cache[password] = cache[password] || ({});
  c = cp[iter] = cp[iter] || ({
    firstSalt: obj.salt && obj.salt.length ? obj.salt.slice(0) : sjcl.random.randomWords(2, 0)
  });
  salt = obj.salt === undefined ? c.firstSalt : obj.salt;
  c[salt] = c[salt] || sjcl.misc.pbkdf2(password, salt, obj.iter);
  return {
    key: c[salt].slice(0),
    salt: salt.slice(0)
  };
};

export { sjcl as default };
