import 'module';
import Enc from './encoding.js';
import PEM from './pem.js';
import SSH from './ssh.js';
import x509 from './x509.js';
import a$1 from 'crypto';

var EC = global.EC;
var EC = module.exports;
var OBJ_ID_EC = ("06 08 2A8648CE3D030107").replace(/\s+/g, "").toLowerCase();
var OBJ_ID_EC_384 = ("06 05 2B81040022").replace(/\s+/g, "").toLowerCase();
EC.generate = function (opts) {
  return Promise.resolve().then(function () {
    var typ = "ec";
    var format = opts.format;
    var encoding = opts.encoding;
    var priv;
    var pub = "spki";
    if (!format) {
      format = "jwk";
    }
    if (-1 !== ["spki", "pkcs8", "ssh"].indexOf(format)) {
      format = "pkcs8";
    }
    if ("pem" === format) {
      format = "sec1";
      encoding = "pem";
    } else if ("der" === format) {
      format = "sec1";
      encoding = "der";
    }
    if ("jwk" === format || "json" === format) {
      format = "jwk";
      encoding = "json";
    } else {
      priv = format;
    }
    if (!encoding) {
      encoding = "pem";
    }
    if (priv) {
      priv = {
        type: priv,
        format: encoding
      };
      pub = {
        type: pub,
        format: encoding
      };
    } else {
      priv = {
        type: "sec1",
        format: "pem"
      };
      pub = {
        type: "spki",
        format: "pem"
      };
    }
    return new Promise(function (resolve, reject) {
      return a$1.generateKeyPair(typ, {
        namedCurve: opts.crv || opts.namedCurve || "P-256",
        privateKeyEncoding: priv,
        publicKeyEncoding: pub
      }, function (err, pubkey, privkey) {
        if (err) {
          reject(err);
        }
        resolve({
          private: privkey,
          public: pubkey
        });
      });
    }).then(function (keypair) {
      if ("jwk" === format) {
        return {
          private: EC.importSync({
            pem: keypair.private,
            format: priv.type
          }),
          public: EC.importSync({
            pem: keypair.public,
            format: pub.type,
            public: true
          })
        };
      }
      if ("ssh" !== opts.format) {
        return keypair;
      }
      return {
        private: keypair.private,
        public: EC.exportSync({
          jwk: EC.importSync({
            pem: keypair.public,
            format: format,
            public: true
          }),
          format: opts.format,
          public: true
        })
      };
    });
  });
};
EC.importSync = function importEcSync(opts) {
  if (!opts || !opts.pem || "string" !== typeof opts.pem) {
    throw new Error("must pass { pem: pem } as a string");
  }
  if (0 === opts.pem.indexOf("ecdsa-sha2-")) {
    return SSH.parseSsh(opts.pem);
  }
  var pem = opts.pem;
  var u8 = PEM.parseBlock(pem).bytes;
  var hex = Enc.bufToHex(u8);
  var jwk = {
    kty: "EC",
    crv: null,
    x: null,
    y: null
  };
  if (-1 !== hex.indexOf(OBJ_ID_EC)) {
    jwk.crv = "P-256";
    if (2 === u8[3] && 48 === u8[6] && 6 === u8[8]) {
      jwk = x509.parsePkcs8(u8, jwk);
    } else if (2 === u8[2] && 4 === u8[5] && 160 === u8[39]) {
      jwk = x509.parseSec1(u8, jwk);
    } else if (48 === u8[2] && 6 === u8[4] && 6 === u8[13]) {
      jwk = x509.parseSpki(u8, jwk);
    } else {
      throw new Error("unrecognized key format");
    }
  } else if (-1 !== hex.indexOf(OBJ_ID_EC_384)) {
    jwk.crv = "P-384";
    if (2 === u8[3] && 48 === u8[6] && 6 === u8[8]) {
      jwk = x509.parsePkcs8(u8, jwk);
    } else if (2 === u8[3] && 4 === u8[6] && 160 === u8[56]) {
      jwk = x509.parseSec1(u8, jwk);
    } else if (48 === u8[2] && 6 === u8[4] && 6 === u8[13]) {
      jwk = x509.parseSpki(u8, jwk);
    } else {
      throw new Error("unrecognized key format");
    }
  } else {
    throw new Error("Supported key types are P-256 and P-384");
  }
  if (opts.public) {
    if (true !== opts.public) {
      throw new Error("options.public must be either `true` or `false` not (" + typeof opts.public + ") '" + opts.public + "'");
    }
    delete jwk.d;
  }
  return jwk;
};
EC.parse = function parseEc(opts) {
  return Promise.resolve().then(function () {
    return EC.importSync(opts);
  });
};
EC.toJwk = EC.import = EC.parse;
EC.exportSync = function (opts) {
  if (!opts || !opts.jwk || "object" !== typeof opts.jwk) {
    throw new Error("must pass { jwk: jwk } as a JSON object");
  }
  var jwk = JSON.parse(JSON.stringify(opts.jwk));
  var format = opts.format;
  if (opts.public || -1 !== ["spki", "pkix", "ssh", "rfc4716"].indexOf(format)) {
    jwk.d = null;
  }
  if ("EC" !== jwk.kty) {
    throw new Error("options.jwk.kty must be 'EC' for EC keys");
  }
  if (!jwk.d) {
    if (!format || -1 !== ["spki", "pkix"].indexOf(format)) {
      format = "spki";
    } else if (-1 !== ["ssh", "rfc4716"].indexOf(format)) {
      format = "ssh";
    } else {
      throw new Error("options.format must be 'spki' or 'ssh' for public EC keys, not (" + typeof format + ") " + format);
    }
  } else {
    if (!format || "sec1" === format) {
      format = "sec1";
    } else if ("pkcs8" !== format) {
      throw new Error("options.format must be 'sec1' or 'pkcs8' for private EC keys, not '" + format + "'");
    }
  }
  if (-1 === ["P-256", "P-384"].indexOf(jwk.crv)) {
    throw new Error("options.jwk.crv must be either P-256 or P-384 for EC keys, not '" + jwk.crv + "'");
  }
  if (!jwk.y) {
    throw new Error("options.jwk.y must be a urlsafe base64-encoded either P-256 or P-384");
  }
  if ("sec1" === format) {
    return PEM.packBlock({
      type: "EC PRIVATE KEY",
      bytes: x509.packSec1(jwk)
    });
  } else if ("pkcs8" === format) {
    return PEM.packBlock({
      type: "PRIVATE KEY",
      bytes: x509.packPkcs8(jwk)
    });
  } else if (-1 !== ["spki", "pkix"].indexOf(format)) {
    return PEM.packBlock({
      type: "PUBLIC KEY",
      bytes: x509.packSpki(jwk)
    });
  } else if (-1 !== ["ssh", "rfc4716"].indexOf(format)) {
    return SSH.packSsh(jwk);
  } else {
    throw new Error("Sanity Error: reached unreachable code block with format: " + format);
  }
};
EC.pack = function (opts) {
  return Promise.resolve().then(function () {
    return EC.exportSync(opts);
  });
};
EC.__thumbprint = function (jwk) {
  var str = "{\"crv\":\"" + jwk.crv + "\",\"kty\":\"EC\",\"x\":\"" + jwk.x + "\",\"y\":\"" + jwk.y + "\"}";
  var buf = a$1.createHash("sha256").update(str).digest();
  return Enc.bufToUrlBase64(buf);
};
EC.thumbprint = function (opts) {
  return Promise.resolve().then(function () {
    var jwk;
    if ("EC" === opts.kty) {
      jwk = opts;
    } else if (opts.jwk) {
      jwk = opts.jwk;
    } else {
      jwk = EC.importSync(opts);
    }
    return EC.__thumbprint(jwk);
  });
};
EC.toPem = EC.export = EC.pack;
var a = EC;

export { a as default };
