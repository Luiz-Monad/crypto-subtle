'use strict';

var crypto = require('crypto');
var ASN1 = require('./asn1.js');
var Enc = require('./encoding.js');
var PEM = require('./pem.js');
var X509 = require('./x509.js');
var Rasha = require('rasha');
var RSA = {};

/*global Promise*/
var CSR = module.exports = function rsacsr(opts) {
  // We're using a Promise here to be compatible with the browser version
  // which will probably use the webcrypto API for some of the conversions
  opts = CSR._prepare(opts);
  return CSR.create(opts).then(function (bytes) {
    return CSR._encode(opts, bytes);
  });
};
CSR._prepare = function (opts) {
  opts = JSON.parse(JSON.stringify(opts));
  var pem, jwk;

  // We do a bit of extra error checking for user convenience
  if (!opts) {
    throw new Error("You must pass options with key and domains to rsacsr");
  }
  if (!Array.isArray(opts.domains) || 0 === opts.domains.length) {
    new Error("You must pass options.domains as a non-empty array");
  }

  // I need to check that 例.中国 is a valid domain name
  if (!opts.domains.every(function (d) {
    // allow punycode? xn--
    if ('string' === typeof d /*&& /\./.test(d) && !/--/.test(d)*/) {
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
  if ('der' === (opts.encoding || '').toLowerCase()) {
    return bytes;
  }
  return PEM.packBlock({
    type: "CERTIFICATE REQUEST",
    bytes: bytes /* { jwk: jwk, domains: opts.domains } */
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
  var sty = ASN1('30'
  // 1.2.840.113549.1.1.11 sha256WithRSAEncryption (PKCS #1)
  , ASN1('06', '2a864886f70d01010b'), ASN1('05'));
  return ASN1('30'
  // The Full CSR Request Body
  , opts.request
  // The Signature Type
  , sty
  // The Signature
  , ASN1.BitStr(Enc.bufToHex(opts.signature)));
};

//
// RSA
//

// Took some tips from https://gist.github.com/codermapuche/da4f96cdb6d5ff53b7ebc156ec46a10a
RSA.signSync = function signRsaSync(keypem, ab) {
  // Signer is a stream
  var sign = crypto.createSign('SHA256');
  sign.write(ab);
  sign.end();

  // The signature is ASN1 encoded, as it turns out
  var sig = sign.sign(keypem);

  // Convert to a JavaScript ArrayBuffer just because
  return sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength);
};
RSA.sign = function signRsa(keypem, ab) {
  return Promise.resolve().then(function () {
    return RSA.signSync(keypem, ab);
  });
};
