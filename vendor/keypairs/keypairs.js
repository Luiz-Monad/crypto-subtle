'use strict';

var Eckles = require('eckles');
var Rasha = require('rasha');
var Enc = {};
var Keypairs = module.exports = {};

/*global Promise*/

Keypairs.generate = function (opts) {
  opts = opts || {};
  var kty = opts.kty || opts.type;
  var p;
  if ('RSA' === kty) {
    p = Rasha.generate(opts);
  } else {
    p = Eckles.generate(opts);
  }
  return p.then(function (pair) {
    return Keypairs.thumbprint({
      jwk: pair.public
    }).then(function (thumb) {
      pair.private.kid = thumb; // maybe not the same id on the private key?
      pair.public.kid = thumb;
      return pair;
    });
  });
};
Keypairs.parse = function (opts) {
  opts = opts || {};
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
      // 'd' happens to be the name of a private part of both RSA and ECDSA keys
      if (opts.public || opts.publish || !jwk.d) {
        if (opts.private) {
          // TODO test that it can actually sign?
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
  return Eckles.import(opts).catch(function () {
    return Rasha.import(opts);
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
    if ('RSA' === opts.jwk.kty) {
      return Rasha.export(opts);
    } else {
      return Eckles.export(opts);
    }
  });
};

// Chopping off the private parts is now part of the public API.
// I thought it sounded a little too crude at first, but it really is the best name in every possible way.
Keypairs.neuter = Keypairs._neuter = function (opts) {
  // trying to find the best balance of an immutable copy with custom attributes
  var jwk = {};
  Object.keys(opts.jwk).forEach(function (k) {
    if ('undefined' === typeof opts.jwk[k]) {
      return;
    }
    // ignore RSA and EC private parts
    if (-1 !== ['d', 'p', 'q', 'dp', 'dq', 'qi'].indexOf(k)) {
      return;
    }
    jwk[k] = JSON.parse(JSON.stringify(opts.jwk[k]));
  });
  return jwk;
};
Keypairs.publish = function (opts) {
  if ('object' !== typeof opts.jwk || !opts.jwk.kty) {
    throw new Error("invalid jwk: " + JSON.stringify(opts.jwk));
  }

  // returns a copy
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
    if ('RSA' === opts.jwk.kty) {
      return Rasha.thumbprint(opts);
    } else {
      return Eckles.thumbprint(opts);
    }
  });
};

// JWT a.k.a. JWS with Claims using Compact Serialization
Keypairs.signJwt = function (opts) {
  return Keypairs.thumbprint({
    jwk: opts.jwk
  }).then(function (thumb) {
    var header = opts.header || {};
    var claims = JSON.parse(JSON.stringify(opts.claims || {}));
    header.typ = 'JWT';
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
      return [jws.protected, jws.payload, jws.signature].join('.');
    });
  });
};
Keypairs.signJws = function (opts) {
  return Keypairs.thumbprint(opts).then(function (thumb) {
    function alg() {
      if (!opts.jwk) {
        throw new Error("opts.jwk must exist and must declare 'typ'");
      }
      return 'RSA' === opts.jwk.kty ? "RS256" : "ES256";
    }
    function sign(pem) {
      var header = opts.header;
      var protect = opts.protected;
      var payload = opts.payload;

      // Compute JWS signature
      var protectedHeader = "";
      // Because unprotected headers are allowed, regrettably...
      // https://stackoverflow.com/a/46288694
      if (false !== protect) {
        if (!protect) {
          protect = {};
        }
        if (!protect.alg) {
          protect.alg = alg();
        }
        // There's a particular request where Let's Encrypt explicitly doesn't use a kid
        if (!protect.kid && false !== protect.kid) {
          protect.kid = thumb;
        }
        protectedHeader = JSON.stringify(protect);
      }

      // Convert payload to Buffer
      if ('string' !== typeof payload && !Buffer.isBuffer(payload)) {
        if (!payload) {
          throw new Error("opts.payload should be JSON, string, or Buffer (it may be empty, but that must be explicit)");
        }
        payload = JSON.stringify(payload);
      }
      if ('string' === typeof payload) {
        payload = Buffer.from(payload, 'binary');
      }

      // node specifies RSA-SHAxxx even whet it's actually ecdsa (it's all encoded x509 shasums anyway)
      var nodeAlg = "SHA" + (((protect || header).alg || '').replace(/^[^\d]+/, '') || '256');
      var protected64 = Enc.strToUrlBase64(protectedHeader);
      var payload64 = Enc.bufToUrlBase64(payload);
      var binsig = require('crypto').createSign(nodeAlg).update(protect ? protected64 + "." + payload64 : payload64).sign(pem);
      if ('EC' === opts.jwk.kty) {
        // ECDSA JWT signatures differ from "normal" ECDSA signatures
        // https://tools.ietf.org/html/rfc7518#section-3.4
        binsig = convertIfEcdsa(binsig);
      }
      var sig = binsig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      return {
        header: header,
        protected: protected64 || undefined,
        payload: payload64,
        signature: sig
      };
    }
    function convertIfEcdsa(binsig) {
      // should have asn1 sequence header of 0x30
      if (0x30 !== binsig[0]) {
        throw new Error("Impossible EC SHA head marker");
      }
      var index = 2; // first ecdsa "R" header byte
      var len = binsig[1];
      var lenlen = 0;
      // Seek length of length if length is greater than 127 (i.e. two 512-bit / 64-byte R and S values)
      if (0x80 & len) {
        lenlen = len - 0x80; // should be exactly 1
        len = binsig[2]; // should be <= 130 (two 64-bit SHA-512s, plus padding)
        index += lenlen;
      }
      // should be of BigInt type
      if (0x02 !== binsig[index]) {
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
      var r = binsig.slice(index + 1, index + 1 + rlen).toString('hex');
      var slen = binsig[index + 1 + rlen + 1]; // skip header and read length
      var s = binsig.slice(index + 1 + rlen + 1 + 1).toString('hex');
      if (2 * slen !== s.length) {
        throw new Error("Impossible EC SHA S length");
      }
      // There may be one byte of padding on either
      while (r.length < 2 * bits) {
        r = '00' + r;
      }
      while (s.length < 2 * bits) {
        s = '00' + s;
      }
      if (2 * (bits + 1) === r.length) {
        r = r.slice(2);
      }
      if (2 * (bits + 1) === s.length) {
        s = s.slice(2);
      }
      return Buffer.concat([Buffer.from(r, 'hex'), Buffer.from(s, 'hex')]);
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
  if ('number' === typeof time) {
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
    // fancy fallthrough, what fun!
    case 'd':
      mult *= 24;
    /*falls through*/
    case 'h':
      mult *= 60;
    /*falls through*/
    case 'm':
      mult *= 60;
    /*falls through*/
    case 's':
      mult *= 1;
  }
  return now + mult * num;
}
Enc.strToUrlBase64 = function (str) {
  // node automatically can tell the difference
  // between uc2 (utf-8) strings and binary strings
  // so we don't have to re-encode the strings
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
Enc.bufToUrlBase64 = function (buf) {
  // allow for Uint8Array as a Buffer
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// For 'rsa-compat' module only
// PLEASE do not use these sync methods, they are deprecated
Keypairs._importSync = function (opts) {
  try {
    return Eckles.importSync(opts);
  } catch (e) {
    try {
      return Rasha.importSync(opts);
    } catch (e) {
      console.error("options.pem does not appear to be a valid RSA or ECDSA public or private key");
    }
  }
};
// PLEASE do not use these, they are deprecated
Keypairs._exportSync = function (opts) {
  if ('RSA' === opts.jwk.kty) {
    return Rasha.exportSync(opts);
  } else {
    return Eckles.exportSync(opts);
  }
};
