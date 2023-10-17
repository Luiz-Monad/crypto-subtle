import 'module';
import module$2 from '../eckles/index.js';
import module$1 from '../rasha/index.js';
import a from 'crypto';

var Keypairs = global.Keypairs;
var Enc = {};
var Keypairs = module.exports;
Keypairs.generate = function (opts) {
  opts = opts || ({});
  var kty = opts.kty || opts.type;
  var p;
  if ("RSA" === kty) {
    p = module$1.generate(opts);
  } else {
    p = module$2.generate(opts);
  }
  return p.then(function (pair) {
    return Keypairs.thumbprint({
      jwk: pair.public
    }).then(function (thumb) {
      pair.private.kid = thumb;
      pair.public.kid = thumb;
      return pair;
    });
  });
};
Keypairs.parse = function (opts) {
  opts = opts || ({});
  var err;
  var jwk;
  var pem;
  var p;
  if (!opts.key || !opts.key.kty) {
    try {
      jwk = JSON.parse(opts.key);
      p = Keypairs.export({
        jwk: jwk
      }).catch(function (e) {
        pem = opts.key;
        err = new Error("Not a valid jwk '" + JSON.stringify(jwk) + "':" + e.message);
        err.code = "EINVALID";
        return Promise.reject(err);
      }).then(function () {
        return jwk;
      });
    } catch (e) {
      p = Keypairs.import({
        pem: opts.key
      }).catch(function (e) {
        err = new Error("Could not parse key (type " + typeof opts.key + ") '" + opts.key + "': " + e.message);
        err.code = "EPARSE";
        return Promise.reject(err);
      });
    }
  } else {
    p = Promise.resolve(opts.key);
  }
  return p.then(function (jwk) {
    var pubopts = JSON.parse(JSON.stringify(opts));
    pubopts.jwk = jwk;
    return Keypairs.publish(pubopts).then(function (pub) {
      if (opts.public || opts.publish || !jwk.d) {
        if (opts.private) {
          err = new Error("Not a private key '" + JSON.stringify(jwk) + "'");
          err.code = "ENOTPRIVATE";
          return Promise.reject(err);
        }
        return {
          public: pub
        };
      } else {
        return {
          private: jwk,
          public: pub
        };
      }
    });
  });
};
Keypairs.parseOrGenerate = function (opts) {
  if (!opts.key) {
    return Keypairs.generate(opts);
  }
  opts.private = true;
  return Keypairs.parse(opts).catch(function (e) {
    console.warn(e.message);
    return Keypairs.generate(opts);
  });
};
Keypairs.import = function (opts) {
  return module$2.import(opts).catch(function () {
    return module$1.import(opts);
  }).then(function (jwk) {
    return Keypairs.thumbprint({
      jwk: jwk
    }).then(function (thumb) {
      jwk.kid = thumb;
      return jwk;
    });
  });
};
Keypairs.export = function (opts) {
  return Promise.resolve().then(function () {
    if ("RSA" === opts.jwk.kty) {
      return module$1.export(opts);
    } else {
      return module$2.export(opts);
    }
  });
};
Keypairs.neuter = Keypairs._neuter = function (opts) {
  var jwk = {};
  Object.keys(opts.jwk).forEach(function (k) {
    if ("undefined" === typeof opts.jwk[k]) {
      return;
    }
    if (-1 !== ["d", "p", "q", "dp", "dq", "qi"].indexOf(k)) {
      return;
    }
    jwk[k] = JSON.parse(JSON.stringify(opts.jwk[k]));
  });
  return jwk;
};
Keypairs.publish = function (opts) {
  if ("object" !== typeof opts.jwk || !opts.jwk.kty) {
    throw new Error("invalid jwk: " + JSON.stringify(opts.jwk));
  }
  var jwk = Keypairs.neuter(opts);
  if (jwk.exp) {
    jwk.exp = setTime(jwk.exp);
  } else {
    if (opts.exp) {
      jwk.exp = setTime(opts.exp);
    } else if (opts.expiresIn) {
      jwk.exp = Math.round(Date.now() / 1000) + opts.expiresIn;
    } else if (opts.expiresAt) {
      jwk.exp = opts.expiresAt;
    }
  }
  if (!jwk.use && false !== jwk.use) {
    jwk.use = "sig";
  }
  if (jwk.kid) {
    return Promise.resolve(jwk);
  }
  return Keypairs.thumbprint({
    jwk: jwk
  }).then(function (thumb) {
    jwk.kid = thumb;
    return jwk;
  });
};
Keypairs.thumbprint = function (opts) {
  return Promise.resolve().then(function () {
    if ("RSA" === opts.jwk.kty) {
      return module$1.thumbprint(opts);
    } else {
      return module$2.thumbprint(opts);
    }
  });
};
Keypairs.signJwt = function (opts) {
  return Keypairs.thumbprint({
    jwk: opts.jwk
  }).then(function (thumb) {
    var header = opts.header || ({});
    var claims = JSON.parse(JSON.stringify(opts.claims || ({})));
    header.typ = "JWT";
    if (!header.kid) {
      header.kid = thumb;
    }
    if (!header.alg && opts.alg) {
      header.alg = opts.alg;
    }
    if (!claims.iat && (false === claims.iat || false === opts.iat)) {
      claims.iat = undefined;
    } else if (!claims.iat) {
      claims.iat = Math.round(Date.now() / 1000);
    }
    if (opts.exp) {
      claims.exp = setTime(opts.exp);
    } else if (!claims.exp && (false === claims.exp || false === opts.exp)) {
      claims.exp = undefined;
    } else if (!claims.exp) {
      throw new Error("opts.claims.exp should be the expiration date as seconds, human form (i.e. '1h' or '15m') or false");
    }
    if (opts.iss) {
      claims.iss = opts.iss;
    }
    if (!claims.iss && (false === claims.iss || false === opts.iss)) {
      claims.iss = undefined;
    } else if (!claims.iss) {
      throw new Error("opts.claims.iss should be in the form of https://example.com/, a secure OIDC base url");
    }
    return Keypairs.signJws({
      jwk: opts.jwk,
      pem: opts.pem,
      protected: header,
      header: undefined,
      payload: claims
    }).then(function (jws) {
      return [jws.protected, jws.payload, jws.signature].join(".");
    });
  });
};
Keypairs.signJws = function (opts) {
  return Keypairs.thumbprint(opts).then(function (thumb) {
    function alg() {
      if (!opts.jwk) {
        throw new Error("opts.jwk must exist and must declare 'typ'");
      }
      return "RSA" === opts.jwk.kty ? "RS256" : "ES256";
    }
    function sign(pem) {
      var header = opts.header;
      var protect = opts.protected;
      var payload = opts.payload;
      var protectedHeader = "";
      if (false !== protect) {
        if (!protect) {
          protect = {};
        }
        if (!protect.alg) {
          protect.alg = alg();
        }
        if (!protect.kid && false !== protect.kid) {
          protect.kid = thumb;
        }
        protectedHeader = JSON.stringify(protect);
      }
      if ("string" !== typeof payload && !Buffer.isBuffer(payload)) {
        if (!payload) {
          throw new Error("opts.payload should be JSON, string, or Buffer (it may be empty, but that must be explicit)");
        }
        payload = JSON.stringify(payload);
      }
      if ("string" === typeof payload) {
        payload = Buffer.from(payload, "binary");
      }
      var nodeAlg = "SHA" + (((protect || header).alg || "").replace(/^[^\d]+/, "") || "256");
      var protected64 = Enc.strToUrlBase64(protectedHeader);
      var payload64 = Enc.bufToUrlBase64(payload);
      var binsig = a.createSign(nodeAlg).update(protect ? protected64 + "." + payload64 : payload64).sign(pem);
      if ("EC" === opts.jwk.kty) {
        binsig = convertIfEcdsa(binsig);
      }
      var sig = binsig.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      return {
        header: header,
        protected: protected64 || undefined,
        payload: payload64,
        signature: sig
      };
    }
    function convertIfEcdsa(binsig) {
      if (48 !== binsig[0]) {
        throw new Error("Impossible EC SHA head marker");
      }
      var index = 2;
      var len = binsig[1];
      var lenlen = 0;
      if (128 & len) {
        lenlen = len - 128;
        len = binsig[2];
        index += lenlen;
      }
      if (2 !== binsig[index]) {
        throw new Error("Impossible EC SHA R marker");
      }
      index += 1;
      var rlen = binsig[index];
      var bits = 32;
      if (rlen > 49) {
        bits = 64;
      } else if (rlen > 33) {
        bits = 48;
      }
      var r = binsig.slice(index + 1, index + 1 + rlen).toString("hex");
      var slen = binsig[index + 1 + rlen + 1];
      var s = binsig.slice(index + 1 + rlen + 1 + 1).toString("hex");
      if (2 * slen !== s.length) {
        throw new Error("Impossible EC SHA S length");
      }
      while (r.length < 2 * bits) {
        r = "00" + r;
      }
      while (s.length < 2 * bits) {
        s = "00" + s;
      }
      if (2 * (bits + 1) === r.length) {
        r = r.slice(2);
      }
      if (2 * (bits + 1) === s.length) {
        s = s.slice(2);
      }
      return Buffer.concat([Buffer.from(r, "hex"), Buffer.from(s, "hex")]);
    }
    if (opts.pem && opts.jwk) {
      return sign(opts.pem);
    } else {
      return Keypairs.export({
        jwk: opts.jwk
      }).then(sign);
    }
  });
};
function setTime(time) {
  if ("number" === typeof time) {
    return time;
  }
  var t = time.match(/^(\-?\d+)([dhms])$/i);
  if (!t || !t[0]) {
    throw new Error("'" + time + "' should be datetime in seconds or human-readable format (i.e. 3d, 1h, 15m, 30s");
  }
  var now = Math.round(Date.now() / 1000);
  var num = parseInt(t[1], 10);
  var unit = t[2];
  var mult = 1;
  switch (unit) {
    case "d":
      mult *= 24;
    case "h":
      mult *= 60;
    case "m":
      mult *= 60;
    case "s":
      mult *= 1;
  }
  return now + mult * num;
}
Enc.strToUrlBase64 = function (str) {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
Enc.bufToUrlBase64 = function (buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
Keypairs._importSync = function (opts) {
  try {
    return module$2.importSync(opts);
  } catch (e) {
    try {
      return module$1.importSync(opts);
    } catch (e) {
      console.error("options.pem does not appear to be a valid RSA or ECDSA public or private key");
    }
  }
};
Keypairs._exportSync = function (opts) {
  if ("RSA" === opts.jwk.kty) {
    return module$1.exportSync(opts);
  } else {
    return module$2.exportSync(opts);
  }
};
var Keypairs$1 = Keypairs;

export { Keypairs$1 as default };
