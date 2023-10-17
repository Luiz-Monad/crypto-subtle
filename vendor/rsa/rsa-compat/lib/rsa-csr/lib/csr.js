import 'module';
import a$1 from 'crypto';
import ASN1 from './asn1.js';
import Enc from './encoding.js';
import PEM from './pem.js';
import X509 from './x509.js';

var CSR = global.CSR;
var RSA = {};
var CSR = module.exports = function rsacsr(opts) {
  opts = CSR._prepare(opts);
  return CSR.create(opts).then(function (bytes) {
    return CSR._encode(opts, bytes);
  });
};
CSR._prepare = function (opts) {
  var Rasha;
  opts = JSON.parse(JSON.stringify(opts));
  var pem, jwk;
  if (!opts) {
    throw new Error("You must pass options with key and domains to rsacsr");
  }
  if (!Array.isArray(opts.domains) || 0 === opts.domains.length) ;
  if (!opts.domains.every(function (d) {
    if ("string" === typeof d) {
      return true;
    }
  })) {
    throw new Error("You must pass options.domains as strings");
  }
  if (opts.pem) {
    pem = opts.pem;
  } else if (opts.jwk) {
    jwk = opts.jwk;
  } else {
    if (!opts.key) {
      throw new Error("You must pass options.key as a JSON web key");
    } else if (opts.key.kty) {
      jwk = opts.key;
    } else {
      pem = opts.key;
    }
  }
  if (pem) {
    try {
      Rasha = require("rasha");
    } catch (e) {
      throw new Error("Rasha.js is an optional dependency for PEM-to-JWK.\n" + "Install it if you'd like to use it:\n" + "\tnpm install --save rasha\n" + "Otherwise supply a jwk as the private key.");
    }
    jwk = Rasha.importSync({
      pem: pem
    });
  }
  opts.jwk = jwk;
  return opts;
};
CSR.sync = function (opts) {
  opts = CSR._prepare(opts);
  var bytes = CSR.createSync(opts);
  return CSR._encode(opts, bytes);
};
CSR._encode = function (opts, bytes) {
  if ("der" === (opts.encoding || "").toLowerCase()) {
    return bytes;
  }
  return PEM.packBlock({
    type: "CERTIFICATE REQUEST",
    bytes: bytes
  });
};
CSR.createSync = function createCsr(opts) {
  var hex = CSR.request(opts.jwk, opts.domains);
  var csr = CSR.signSync(opts.jwk, hex);
  return Enc.hexToBuf(csr);
};
CSR.create = function createCsr(opts) {
  var hex = CSR.request(opts.jwk, opts.domains);
  return CSR.sign(opts.jwk, hex).then(function (csr) {
    return Enc.hexToBuf(csr);
  });
};
CSR.request = function createCsrBodyEc(jwk, domains) {
  var asn1pub = X509.packCsrPublicKey(jwk);
  return X509.packCsr(asn1pub, domains);
};
CSR.signSync = function csrEcSig(jwk, request) {
  var keypem = PEM.packBlock({
    type: "RSA PRIVATE KEY",
    bytes: X509.packPkcs1(jwk)
  });
  var sig = RSA.signSync(keypem, Enc.hexToBuf(request));
  return CSR.toDer({
    request: request,
    signature: sig
  });
};
CSR.sign = function csrEcSig(jwk, request) {
  var keypem = PEM.packBlock({
    type: "RSA PRIVATE KEY",
    bytes: X509.packPkcs1(jwk)
  });
  return RSA.sign(keypem, Enc.hexToBuf(request)).then(function (sig) {
    return CSR.toDer({
      request: request,
      signature: sig
    });
  });
};
CSR.toDer = function encode(opts) {
  var sty = ASN1("30", ASN1("06", "2a864886f70d01010b"), ASN1("05"));
  return ASN1("30", opts.request, sty, ASN1.BitStr(Enc.bufToHex(opts.signature)));
};
RSA.signSync = function signRsaSync(keypem, ab) {
  var sign = a$1.createSign("SHA256");
  sign.write(ab);
  sign.end();
  var sig = sign.sign(keypem);
  return sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength);
};
RSA.sign = function signRsa(keypem, ab) {
  return Promise.resolve().then(function () {
    return RSA.signSync(keypem, ab);
  });
};
var a = CSR;

export { a as default };
