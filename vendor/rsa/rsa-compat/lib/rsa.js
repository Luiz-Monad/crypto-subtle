import 'module';
import 'buffer-v6-polyfill';
import Keypairs from '../../keypairs/keypairs.js';
import module$1 from './rsa-csr/index.js';
import a$1 from 'crypto';

var RSA = global.RSA;
var RSA = module.exports;
RSA.utils = {};
try {
  require("buffer-v6-polyfill");
} catch (e) {}
var NOBJ = {};
var DEFAULT_BITLEN = 2048;
var DEFAULT_EXPONENT = 65537;
RSA.generateKeypair = function (options, cb, extra1, extra2) {
  var length;
  var exponent;
  if ("function" === typeof extra2) {
    length = options || DEFAULT_BITLEN;
    exponent = cb || DEFAULT_EXPONENT;
    options = extra1 || NOBJ;
    cb = extra2;
  } else {
    if (!options) {
      options = NOBJ;
    }
    length = options.bitlen || DEFAULT_BITLEN;
    exponent = options.exp || DEFAULT_EXPONENT;
  }
  try {
    var keypair = require("./generate-privkey.js")(length, exponent);
    keypair.thumbprint = RSA.thumbprint(keypair);
    cb(null, keypair);
  } catch (e) {
    cb(e);
  }
};
RSA.import = function (options) {
  options = JSON.parse(JSON.stringify(options));
  if (options.privateKeyPem) {
    if (!options.privateKeyJwk) {
      options.privateKeyJwk = Keypairs._importSync({
        pem: options.privateKeyPem
      });
    }
  }
  if (options.privateKeyJwk) {
    if (!options.privateKeyPem) {
      options.privateKeyPem = Keypairs._exportSync({
        jwk: options.privateKeyJwk,
        format: options.format || "pkcs1",
        encoding: options.encoding || "pem"
      });
    }
  }
  if (options.publicKeyPem || options.privateKeyPem) {
    if (!options.publicKeyJwk) {
      options.publicKeyJwk = Keypairs._importSync({
        pem: options.publicKeyPem || options.privateKeyPem,
        public: true
      });
    }
  }
  if (options.publicKeyJwk || options.privateKeyJwk) {
    if (!options.publicKeyPem) {
      options.publicKeyPem = Keypairs._exportSync({
        jwk: options.publicKeyJwk || options.privateKeyJwk,
        format: options.format || "pkcs1",
        encoding: options.encoding || "pem",
        public: true
      });
    }
  }
  if (!options.publicKeyPem) {
    throw new Error("Error: no keys were present to import");
  }
  if (options.privateKeyPem) {
    options.privateKeyPem = options.privateKeyPem.trim().replace(/[\r\n]+/g, "\r\n") + "\r\n";
  }
  options.publicKeyPem = options.publicKeyPem.trim().replace(/[\r\n]+/g, "\r\n") + "\r\n";
  if (!options.thumbprint) {
    options.thumbprint = RSA._thumbprint(options);
  }
  return options;
};
RSA.exportPrivatePem = function (keypair) {
  keypair = RSA.import(keypair);
  return keypair.privateKeyPem;
};
RSA.exportPublicPem = function (keypair) {
  keypair = RSA.import(keypair);
  return keypair.publicKeyPem;
};
RSA.exportPrivateJwk = function (keypair) {
  keypair = RSA.import(keypair);
  return keypair.privateKeyJwk;
};
RSA.exportPublicJwk = function (keypair) {
  if (!keypair.publicKeyJwk) {
    keypair = RSA.import(keypair);
  }
  return keypair.publicKeyJwk;
};
RSA.signJws = RSA.generateJws = RSA.generateSignatureJws = RSA.generateSignatureJwk = function (keypair, header, protect, payload) {
  var nonce;
  keypair = RSA.import(keypair);
  keypair.publicKeyJwk = RSA.exportPublicJwk(keypair);
  if ("string" === typeof protect || "undefined" === typeof protect && "undefined" === typeof payload) {
    console.warn("deprecation notice: new signature for signJws(keypair, header, protect, payload)");
    payload = header;
    nonce = protect;
    protect = undefined;
    header = {
      alg: "RS256",
      jwk: keypair.publicKeyJwk
    };
    protect = {
      nonce: nonce
    };
  }
  var protectedHeader = "";
  if (protect) {
    protectedHeader = JSON.stringify(protect);
  }
  var protected64 = RSA.utils.toWebsafeBase64(Buffer.from(protectedHeader).toString("base64"));
  var payload64 = RSA.utils.toWebsafeBase64(payload.toString("base64"));
  var raw = protected64 + "." + payload64;
  var pem = RSA.exportPrivatePem(keypair);
  var signer = a$1.createSign("RSA-SHA256");
  signer.update(raw);
  return {
    header: header,
    protected: protected64,
    payload: payload64,
    signature: signer.sign(pem, "base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  };
};
RSA.generateCsrPem = function (keypair, domains) {
  keypair = RSA.import(keypair);
  return module$1.sync({
    jwk: keypair.privateKeyJwk,
    domains: domains
  });
};
RSA.generateCsrDer = function (keypair, domains) {
  keypair = RSA.import(keypair);
  return module$1.sync({
    jwk: keypair.privateKeyJwk,
    domains: domains,
    encoding: "der"
  });
};
RSA.generateCsrDerWeb64 = RSA.generateCsrWeb64 = function (keypair, names) {
  var buf = RSA.generateCsrDer(keypair, names);
  var b64 = buf.toString("base64");
  return RSA.utils.toWebsafeBase64(b64);
};
RSA._thumbprintInput = function (n, e) {
  return Buffer.from("{\"e\":\"" + e + "\",\"kty\":\"RSA\",\"n\":\"" + n + "\"}", "ascii");
};
RSA._thumbprint = function (keypair) {
  var publicKeyJwk = keypair.publicKeyJwk;
  if (!publicKeyJwk.e || !publicKeyJwk.n) {
    throw new Error("You must provide an RSA jwk with 'e' and 'n' (the public components)");
  }
  var input = RSA._thumbprintInput(publicKeyJwk.n, publicKeyJwk.e);
  var base64Digest = a$1.createHash("sha256").update(input).digest("base64");
  return RSA.utils.toWebsafeBase64(base64Digest);
};
RSA.thumbprint = function (keypair) {
  if (!keypair.publicKeyJwk) {
    keypair.publicKeyJwk = RSA.exportPublicJwk(keypair);
  }
  return RSA._thumbprint(keypair);
};
RSA.utils.toWebsafeBase64 = function (b64) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
RSA.exportPrivateKey = RSA.exportPrivatePem;
RSA.exportPublicKey = RSA.exportPublicPem;
var a = RSA;

export { a as default };
