import 'module';
import './aes.js';
import './asn1.js';
import './des.js';
import './md.js';
import './oids.js';
import './pem.js';
import './pbkdf2.js';
import './random.js';
import './rc2.js';
import './rsa.js';
import './util.js';

var forge = global.forge;
if (typeof BigInteger === "undefined") {
  var BigInteger = forge.jsbn.BigInteger;
}
var asn1 = forge.asn1;
var pki = forge.pki = forge.pki || ({});
pki.pbe = forge.pbe = forge.pbe || ({});
var oids = pki.oids;
var encryptedPrivateKeyValidator = {
  name: "EncryptedPrivateKeyInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "EncryptedPrivateKeyInfo.encryptionAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "AlgorithmIdentifier.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "encryptionOid"
    }, {
      name: "AlgorithmIdentifier.parameters",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "encryptionParams"
    }]
  }, {
    name: "EncryptedPrivateKeyInfo.encryptedData",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OCTETSTRING,
    constructed: false,
    capture: "encryptedData"
  }]
};
var PBES2AlgorithmsValidator = {
  name: "PBES2Algorithms",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "PBES2Algorithms.keyDerivationFunc",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "PBES2Algorithms.keyDerivationFunc.oid",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "kdfOid"
    }, {
      name: "PBES2Algorithms.params",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "PBES2Algorithms.params.salt",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "kdfSalt"
      }, {
        name: "PBES2Algorithms.params.iterationCount",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "kdfIterationCount"
      }, {
        name: "PBES2Algorithms.params.keyLength",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        optional: true,
        capture: "keyLength"
      }, {
        name: "PBES2Algorithms.params.prf",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        optional: true,
        value: [{
          name: "PBES2Algorithms.params.prf.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "prfOid"
        }]
      }]
    }]
  }, {
    name: "PBES2Algorithms.encryptionScheme",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "PBES2Algorithms.encryptionScheme.oid",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "encOid"
    }, {
      name: "PBES2Algorithms.encryptionScheme.iv",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OCTETSTRING,
      constructed: false,
      capture: "encIv"
    }]
  }]
};
var pkcs12PbeParamsValidator = {
  name: "pkcs-12PbeParams",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "pkcs-12PbeParams.salt",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OCTETSTRING,
    constructed: false,
    capture: "salt"
  }, {
    name: "pkcs-12PbeParams.iterations",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "iterations"
  }]
};
pki.encryptPrivateKeyInfo = function (obj, password, options) {
  options = options || ({});
  options.saltSize = options.saltSize || 8;
  options.count = options.count || 2048;
  options.algorithm = options.algorithm || "aes128";
  options.prfAlgorithm = options.prfAlgorithm || "sha1";
  var salt = forge.random.getBytesSync(options.saltSize);
  var count = options.count;
  var countBytes = asn1.integerToDer(count);
  var dkLen;
  var encryptionAlgorithm;
  var encryptedData;
  if (options.algorithm.indexOf("aes") === 0 || options.algorithm === "des") {
    var ivLen, encOid, cipherFn;
    switch (options.algorithm) {
      case "aes128":
        dkLen = 16;
        ivLen = 16;
        encOid = oids["aes128-CBC"];
        cipherFn = forge.aes.createEncryptionCipher;
        break;
      case "aes192":
        dkLen = 24;
        ivLen = 16;
        encOid = oids["aes192-CBC"];
        cipherFn = forge.aes.createEncryptionCipher;
        break;
      case "aes256":
        dkLen = 32;
        ivLen = 16;
        encOid = oids["aes256-CBC"];
        cipherFn = forge.aes.createEncryptionCipher;
        break;
      case "des":
        dkLen = 8;
        ivLen = 8;
        encOid = oids["desCBC"];
        cipherFn = forge.des.createEncryptionCipher;
        break;
      default:
        var error = new Error("Cannot encrypt private key. Unknown encryption algorithm.");
        error.algorithm = options.algorithm;
        throw error;
    }
    var prfAlgorithm = "hmacWith" + options.prfAlgorithm.toUpperCase();
    var md = prfAlgorithmToMessageDigest(prfAlgorithm);
    var dk = forge.pkcs5.pbkdf2(password, salt, count, dkLen, md);
    var iv = forge.random.getBytesSync(ivLen);
    var cipher = cipherFn(dk);
    cipher.start(iv);
    cipher.update(asn1.toDer(obj));
    cipher.finish();
    encryptedData = cipher.output.getBytes();
    var params = createPbkdf2Params(salt, countBytes, dkLen, prfAlgorithm);
    encryptionAlgorithm = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oids["pkcs5PBES2"]).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oids["pkcs5PBKDF2"]).getBytes()), params]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(encOid).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, iv)])])]);
  } else if (options.algorithm === "3des") {
    dkLen = 24;
    var saltBytes = new forge.util.ByteBuffer(salt);
    var dk = pki.pbe.generatePkcs12Key(password, saltBytes, 1, count, dkLen);
    var iv = pki.pbe.generatePkcs12Key(password, saltBytes, 2, count, dkLen);
    var cipher = forge.des.createEncryptionCipher(dk);
    cipher.start(iv);
    cipher.update(asn1.toDer(obj));
    cipher.finish();
    encryptedData = cipher.output.getBytes();
    encryptionAlgorithm = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, salt), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, countBytes.getBytes())])]);
  } else {
    var error = new Error("Cannot encrypt private key. Unknown encryption algorithm.");
    error.algorithm = options.algorithm;
    throw error;
  }
  var rval = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [encryptionAlgorithm, asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, encryptedData)]);
  return rval;
};
pki.decryptPrivateKeyInfo = function (obj, password) {
  var rval = null;
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, encryptedPrivateKeyValidator, capture, errors)) {
    var error = new Error("Cannot read encrypted private key. " + "ASN.1 object is not a supported EncryptedPrivateKeyInfo.");
    error.errors = errors;
    throw error;
  }
  var oid = asn1.derToOid(capture.encryptionOid);
  var cipher = pki.pbe.getCipher(oid, capture.encryptionParams, password);
  var encrypted = forge.util.createBuffer(capture.encryptedData);
  cipher.update(encrypted);
  if (cipher.finish()) {
    rval = asn1.fromDer(cipher.output);
  }
  return rval;
};
pki.encryptedPrivateKeyToPem = function (epki, maxline) {
  var msg = {
    type: "ENCRYPTED PRIVATE KEY",
    body: asn1.toDer(epki).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};
pki.encryptedPrivateKeyFromPem = function (pem) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "ENCRYPTED PRIVATE KEY") {
    var error = new Error("Could not convert encrypted private key from PEM; " + "PEM header type is \"ENCRYPTED PRIVATE KEY\".");
    error.headerType = msg.type;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert encrypted private key from PEM; " + "PEM is encrypted.");
  }
  return asn1.fromDer(msg.body);
};
pki.encryptRsaPrivateKey = function (rsaKey, password, options) {
  options = options || ({});
  if (!options.legacy) {
    var rval = pki.wrapRsaPrivateKey(pki.privateKeyToAsn1(rsaKey));
    rval = pki.encryptPrivateKeyInfo(rval, password, options);
    return pki.encryptedPrivateKeyToPem(rval);
  }
  var algorithm;
  var iv;
  var dkLen;
  var cipherFn;
  switch (options.algorithm) {
    case "aes128":
      algorithm = "AES-128-CBC";
      dkLen = 16;
      iv = forge.random.getBytesSync(16);
      cipherFn = forge.aes.createEncryptionCipher;
      break;
    case "aes192":
      algorithm = "AES-192-CBC";
      dkLen = 24;
      iv = forge.random.getBytesSync(16);
      cipherFn = forge.aes.createEncryptionCipher;
      break;
    case "aes256":
      algorithm = "AES-256-CBC";
      dkLen = 32;
      iv = forge.random.getBytesSync(16);
      cipherFn = forge.aes.createEncryptionCipher;
      break;
    case "3des":
      algorithm = "DES-EDE3-CBC";
      dkLen = 24;
      iv = forge.random.getBytesSync(8);
      cipherFn = forge.des.createEncryptionCipher;
      break;
    case "des":
      algorithm = "DES-CBC";
      dkLen = 8;
      iv = forge.random.getBytesSync(8);
      cipherFn = forge.des.createEncryptionCipher;
      break;
    default:
      var error = new Error("Could not encrypt RSA private key; unsupported " + "encryption algorithm \"" + options.algorithm + "\".");
      error.algorithm = options.algorithm;
      throw error;
  }
  var dk = forge.pbe.opensslDeriveBytes(password, iv.substr(0, 8), dkLen);
  var cipher = cipherFn(dk);
  cipher.start(iv);
  cipher.update(asn1.toDer(pki.privateKeyToAsn1(rsaKey)));
  cipher.finish();
  var msg = {
    type: "RSA PRIVATE KEY",
    procType: {
      version: "4",
      type: "ENCRYPTED"
    },
    dekInfo: {
      algorithm: algorithm,
      parameters: forge.util.bytesToHex(iv).toUpperCase()
    },
    body: cipher.output.getBytes()
  };
  return forge.pem.encode(msg);
};
pki.decryptRsaPrivateKey = function (pem, password) {
  var rval = null;
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "ENCRYPTED PRIVATE KEY" && msg.type !== "PRIVATE KEY" && msg.type !== "RSA PRIVATE KEY") {
    var error = new Error("Could not convert private key from PEM; PEM header type " + "is not \"ENCRYPTED PRIVATE KEY\", \"PRIVATE KEY\", or \"RSA PRIVATE KEY\".");
    error.headerType = error;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    var dkLen;
    var cipherFn;
    switch (msg.dekInfo.algorithm) {
      case "DES-CBC":
        dkLen = 8;
        cipherFn = forge.des.createDecryptionCipher;
        break;
      case "DES-EDE3-CBC":
        dkLen = 24;
        cipherFn = forge.des.createDecryptionCipher;
        break;
      case "AES-128-CBC":
        dkLen = 16;
        cipherFn = forge.aes.createDecryptionCipher;
        break;
      case "AES-192-CBC":
        dkLen = 24;
        cipherFn = forge.aes.createDecryptionCipher;
        break;
      case "AES-256-CBC":
        dkLen = 32;
        cipherFn = forge.aes.createDecryptionCipher;
        break;
      case "RC2-40-CBC":
        dkLen = 5;
        cipherFn = function (key) {
          return forge.rc2.createDecryptionCipher(key, 40);
        };
        break;
      case "RC2-64-CBC":
        dkLen = 8;
        cipherFn = function (key) {
          return forge.rc2.createDecryptionCipher(key, 64);
        };
        break;
      case "RC2-128-CBC":
        dkLen = 16;
        cipherFn = function (key) {
          return forge.rc2.createDecryptionCipher(key, 128);
        };
        break;
      default:
        var error = new Error("Could not decrypt private key; unsupported " + "encryption algorithm \"" + msg.dekInfo.algorithm + "\".");
        error.algorithm = msg.dekInfo.algorithm;
        throw error;
    }
    var iv = forge.util.hexToBytes(msg.dekInfo.parameters);
    var dk = forge.pbe.opensslDeriveBytes(password, iv.substr(0, 8), dkLen);
    var cipher = cipherFn(dk);
    cipher.start(iv);
    cipher.update(forge.util.createBuffer(msg.body));
    if (cipher.finish()) {
      rval = cipher.output.getBytes();
    } else {
      return rval;
    }
  } else {
    rval = msg.body;
  }
  if (msg.type === "ENCRYPTED PRIVATE KEY") {
    rval = pki.decryptPrivateKeyInfo(asn1.fromDer(rval), password);
  } else {
    rval = asn1.fromDer(rval);
  }
  if (rval !== null) {
    rval = pki.privateKeyFromAsn1(rval);
  }
  return rval;
};
pki.pbe.generatePkcs12Key = function (password, salt, id, iter, n, md) {
  var j, l;
  if (typeof md === "undefined" || md === null) {
    md = forge.md.sha1.create();
  }
  var u = md.digestLength;
  var v = md.blockLength;
  var result = new forge.util.ByteBuffer();
  var passBuf = new forge.util.ByteBuffer();
  if (password !== null && password !== undefined) {
    for (l = 0; l < password.length; l++) {
      passBuf.putInt16(password.charCodeAt(l));
    }
    passBuf.putInt16(0);
  }
  var p = passBuf.length();
  var s = salt.length();
  var D = new forge.util.ByteBuffer();
  D.fillWithByte(id, v);
  var Slen = v * Math.ceil(s / v);
  var S = new forge.util.ByteBuffer();
  for (l = 0; l < Slen; l++) {
    S.putByte(salt.at(l % s));
  }
  var Plen = v * Math.ceil(p / v);
  var P = new forge.util.ByteBuffer();
  for (l = 0; l < Plen; l++) {
    P.putByte(passBuf.at(l % p));
  }
  var I = S;
  I.putBuffer(P);
  var c = Math.ceil(n / u);
  for (var i = 1; i <= c; i++) {
    var buf = new forge.util.ByteBuffer();
    buf.putBytes(D.bytes());
    buf.putBytes(I.bytes());
    for (var round = 0; round < iter; round++) {
      md.start();
      md.update(buf.getBytes());
      buf = md.digest();
    }
    var B = new forge.util.ByteBuffer();
    for (l = 0; l < v; l++) {
      B.putByte(buf.at(l % u));
    }
    var k = Math.ceil(s / v) + Math.ceil(p / v);
    var Inew = new forge.util.ByteBuffer();
    for (j = 0; j < k; j++) {
      var chunk = new forge.util.ByteBuffer(I.getBytes(v));
      var x = 511;
      for (l = B.length() - 1; l >= 0; l--) {
        x = x >> 8;
        x += B.at(l) + chunk.at(l);
        chunk.setAt(l, x & 255);
      }
      Inew.putBuffer(chunk);
    }
    I = Inew;
    result.putBuffer(buf);
  }
  result.truncate(result.length() - n);
  return result;
};
pki.pbe.getCipher = function (oid, params, password) {
  switch (oid) {
    case pki.oids["pkcs5PBES2"]:
      return pki.pbe.getCipherForPBES2(oid, params, password);
    case pki.oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]:
    case pki.oids["pbewithSHAAnd40BitRC2-CBC"]:
      return pki.pbe.getCipherForPKCS12PBE(oid, params, password);
    default:
      var error = new Error("Cannot read encrypted PBE data block. Unsupported OID.");
      error.oid = oid;
      error.supportedOids = ["pkcs5PBES2", "pbeWithSHAAnd3-KeyTripleDES-CBC", "pbewithSHAAnd40BitRC2-CBC"];
      throw error;
  }
};
pki.pbe.getCipherForPBES2 = function (oid, params, password) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(params, PBES2AlgorithmsValidator, capture, errors)) {
    var error = new Error("Cannot read password-based-encryption algorithm " + "parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo.");
    error.errors = errors;
    throw error;
  }
  oid = asn1.derToOid(capture.kdfOid);
  if (oid !== pki.oids["pkcs5PBKDF2"]) {
    var error = new Error("Cannot read encrypted private key. " + "Unsupported key derivation function OID.");
    error.oid = oid;
    error.supportedOids = ["pkcs5PBKDF2"];
    throw error;
  }
  oid = asn1.derToOid(capture.encOid);
  if (oid !== pki.oids["aes128-CBC"] && oid !== pki.oids["aes192-CBC"] && oid !== pki.oids["aes256-CBC"] && oid !== pki.oids["des-EDE3-CBC"] && oid !== pki.oids["desCBC"]) {
    var error = new Error("Cannot read encrypted private key. " + "Unsupported encryption scheme OID.");
    error.oid = oid;
    error.supportedOids = ["aes128-CBC", "aes192-CBC", "aes256-CBC", "des-EDE3-CBC", "desCBC"];
    throw error;
  }
  var salt = capture.kdfSalt;
  var count = forge.util.createBuffer(capture.kdfIterationCount);
  count = count.getInt(count.length() << 3);
  var dkLen;
  var cipherFn;
  switch (pki.oids[oid]) {
    case "aes128-CBC":
      dkLen = 16;
      cipherFn = forge.aes.createDecryptionCipher;
      break;
    case "aes192-CBC":
      dkLen = 24;
      cipherFn = forge.aes.createDecryptionCipher;
      break;
    case "aes256-CBC":
      dkLen = 32;
      cipherFn = forge.aes.createDecryptionCipher;
      break;
    case "des-EDE3-CBC":
      dkLen = 24;
      cipherFn = forge.des.createDecryptionCipher;
      break;
    case "desCBC":
      dkLen = 8;
      cipherFn = forge.des.createDecryptionCipher;
      break;
  }
  var md = prfOidToMessageDigest(capture.prfOid);
  var dk = forge.pkcs5.pbkdf2(password, salt, count, dkLen, md);
  var iv = capture.encIv;
  var cipher = cipherFn(dk);
  cipher.start(iv);
  return cipher;
};
pki.pbe.getCipherForPKCS12PBE = function (oid, params, password) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(params, pkcs12PbeParamsValidator, capture, errors)) {
    var error = new Error("Cannot read password-based-encryption algorithm " + "parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo.");
    error.errors = errors;
    throw error;
  }
  var salt = forge.util.createBuffer(capture.salt);
  var count = forge.util.createBuffer(capture.iterations);
  count = count.getInt(count.length() << 3);
  var dkLen, dIvLen, cipherFn;
  switch (oid) {
    case pki.oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]:
      dkLen = 24;
      dIvLen = 8;
      cipherFn = forge.des.startDecrypting;
      break;
    case pki.oids["pbewithSHAAnd40BitRC2-CBC"]:
      dkLen = 5;
      dIvLen = 8;
      cipherFn = function (key, iv) {
        var cipher = forge.rc2.createDecryptionCipher(key, 40);
        cipher.start(iv, null);
        return cipher;
      };
      break;
    default:
      var error = new Error("Cannot read PKCS #12 PBE data block. Unsupported OID.");
      error.oid = oid;
      throw error;
  }
  var md = prfOidToMessageDigest(capture.prfOid);
  var key = pki.pbe.generatePkcs12Key(password, salt, 1, count, dkLen, md);
  md.start();
  var iv = pki.pbe.generatePkcs12Key(password, salt, 2, count, dIvLen, md);
  return cipherFn(key, iv);
};
pki.pbe.opensslDeriveBytes = function (password, salt, dkLen, md) {
  if (typeof md === "undefined" || md === null) {
    md = forge.md.md5.create();
  }
  if (salt === null) {
    salt = "";
  }
  var digests = [hash(md, password + salt)];
  for (var length = 16, i = 1; length < dkLen; (++i, length += 16)) {
    digests.push(hash(md, digests[i - 1] + password + salt));
  }
  return digests.join("").substr(0, dkLen);
};
function hash(md, bytes) {
  return md.start().update(bytes).digest().getBytes();
}
function prfOidToMessageDigest(prfOid) {
  var prfAlgorithm;
  if (!prfOid) {
    prfAlgorithm = "hmacWithSHA1";
  } else {
    prfAlgorithm = pki.oids[asn1.derToOid(prfOid)];
    if (!prfAlgorithm) {
      var error = new Error("Unsupported PRF OID.");
      error.oid = prfOid;
      error.supported = ["hmacWithSHA1", "hmacWithSHA224", "hmacWithSHA256", "hmacWithSHA384", "hmacWithSHA512"];
      throw error;
    }
  }
  return prfAlgorithmToMessageDigest(prfAlgorithm);
}
function prfAlgorithmToMessageDigest(prfAlgorithm) {
  var factory = forge.md;
  switch (prfAlgorithm) {
    case "hmacWithSHA224":
      factory = forge.md.sha512;
    case "hmacWithSHA1":
    case "hmacWithSHA256":
    case "hmacWithSHA384":
    case "hmacWithSHA512":
      prfAlgorithm = prfAlgorithm.substr(8).toLowerCase();
      break;
    default:
      var error = new Error("Unsupported PRF algorithm.");
      error.algorithm = prfAlgorithm;
      error.supported = ["hmacWithSHA1", "hmacWithSHA224", "hmacWithSHA256", "hmacWithSHA384", "hmacWithSHA512"];
      throw error;
  }
  return factory[prfAlgorithm].create();
}
function createPbkdf2Params(salt, countBytes, dkLen, prfAlgorithm) {
  var params = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, salt), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, countBytes.getBytes())]);
  if (prfAlgorithm !== "hmacWithSHA1") {
    params.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, forge.util.hexToBytes(dkLen.toString(16))), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids[prfAlgorithm]).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]));
  }
  return params;
}

export { forge as default };
