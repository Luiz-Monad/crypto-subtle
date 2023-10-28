import 'module';
import './asn1.js';
import './jsbn.js';
import './oids.js';
import './pkcs1.js';
import './prime.js';
import './random.js';
import './util.js';

var forge = global.forge;
if (typeof BigInteger === "undefined") {
  var BigInteger = forge.jsbn.BigInteger;
}
var asn1 = forge.asn1;
forge.pki = forge.pki || ({});
forge.pki.rsa = forge.rsa = forge.rsa || ({});
var pki = forge.pki;
var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];
var privateKeyValidator = {
  name: "PrivateKeyInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "PrivateKeyInfo.version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyVersion"
  }, {
    name: "PrivateKeyInfo.privateKeyAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "AlgorithmIdentifier.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "privateKeyOid"
    }]
  }, {
    name: "PrivateKeyInfo",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OCTETSTRING,
    constructed: false,
    capture: "privateKey"
  }]
};
var rsaPrivateKeyValidator = {
  name: "RSAPrivateKey",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "RSAPrivateKey.version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyVersion"
  }, {
    name: "RSAPrivateKey.modulus",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyModulus"
  }, {
    name: "RSAPrivateKey.publicExponent",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyPublicExponent"
  }, {
    name: "RSAPrivateKey.privateExponent",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyPrivateExponent"
  }, {
    name: "RSAPrivateKey.prime1",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyPrime1"
  }, {
    name: "RSAPrivateKey.prime2",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyPrime2"
  }, {
    name: "RSAPrivateKey.exponent1",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyExponent1"
  }, {
    name: "RSAPrivateKey.exponent2",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyExponent2"
  }, {
    name: "RSAPrivateKey.coefficient",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "privateKeyCoefficient"
  }]
};
var rsaPublicKeyValidator = {
  name: "RSAPublicKey",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "RSAPublicKey.modulus",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "publicKeyModulus"
  }, {
    name: "RSAPublicKey.exponent",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "publicKeyExponent"
  }]
};
var publicKeyValidator = forge.pki.rsa.publicKeyValidator = {
  name: "SubjectPublicKeyInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  captureAsn1: "subjectPublicKeyInfo",
  value: [{
    name: "SubjectPublicKeyInfo.AlgorithmIdentifier",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "AlgorithmIdentifier.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "publicKeyOid"
    }]
  }, {
    name: "SubjectPublicKeyInfo.subjectPublicKey",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.BITSTRING,
    constructed: false,
    value: [{
      name: "SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      optional: true,
      captureAsn1: "rsaPublicKey"
    }]
  }]
};
var emsaPkcs1v15encode = function (md) {
  var oid;
  if ((md.algorithm in pki.oids)) {
    oid = pki.oids[md.algorithm];
  } else {
    var error = new Error("Unknown message digest algorithm.");
    error.algorithm = md.algorithm;
    throw error;
  }
  var oidBytes = asn1.oidToDer(oid).getBytes();
  var digestInfo = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
  var digestAlgorithm = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
  digestAlgorithm.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, oidBytes));
  digestAlgorithm.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, ""));
  var digest = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, md.digest().getBytes());
  digestInfo.value.push(digestAlgorithm);
  digestInfo.value.push(digest);
  return asn1.toDer(digestInfo).getBytes();
};
var _modPow = function (x, key, pub) {
  if (pub) {
    return x.modPow(key.e, key.n);
  }
  if (!key.p || !key.q) {
    return x.modPow(key.d, key.n);
  }
  if (!key.dP) {
    key.dP = key.d.mod(key.p.subtract(BigInteger.ONE));
  }
  if (!key.dQ) {
    key.dQ = key.d.mod(key.q.subtract(BigInteger.ONE));
  }
  if (!key.qInv) {
    key.qInv = key.q.modInverse(key.p);
  }
  var r;
  do {
    r = new BigInteger(forge.util.bytesToHex(forge.random.getBytes(key.n.bitLength() / 8)), 16);
  } while (r.compareTo(key.n) >= 0 || !r.gcd(key.n).equals(BigInteger.ONE));
  x = x.multiply(r.modPow(key.e, key.n)).mod(key.n);
  var xp = x.mod(key.p).modPow(key.dP, key.p);
  var xq = x.mod(key.q).modPow(key.dQ, key.q);
  while (xp.compareTo(xq) < 0) {
    xp = xp.add(key.p);
  }
  var y = xp.subtract(xq).multiply(key.qInv).mod(key.p).multiply(key.q).add(xq);
  y = y.multiply(r.modInverse(key.n)).mod(key.n);
  return y;
};
pki.rsa.encrypt = function (m, key, bt) {
  var pub = bt;
  var eb;
  var k = Math.ceil(key.n.bitLength() / 8);
  if (bt !== false && bt !== true) {
    pub = bt === 2;
    eb = _encodePkcs1_v1_5(m, key, bt);
  } else {
    eb = forge.util.createBuffer();
    eb.putBytes(m);
  }
  var x = new BigInteger(eb.toHex(), 16);
  var y = _modPow(x, key, pub);
  var yhex = y.toString(16);
  var ed = forge.util.createBuffer();
  var zeros = k - Math.ceil(yhex.length / 2);
  while (zeros > 0) {
    ed.putByte(0);
    --zeros;
  }
  ed.putBytes(forge.util.hexToBytes(yhex));
  return ed.getBytes();
};
pki.rsa.decrypt = function (ed, key, pub, ml) {
  var k = Math.ceil(key.n.bitLength() / 8);
  if (ed.length !== k) {
    var error = new Error("Encrypted message length is invalid.");
    error.length = ed.length;
    error.expected = k;
    throw error;
  }
  var y = new BigInteger(forge.util.createBuffer(ed).toHex(), 16);
  if (y.compareTo(key.n) >= 0) {
    throw new Error("Encrypted message is invalid.");
  }
  var x = _modPow(y, key, pub);
  var xhex = x.toString(16);
  var eb = forge.util.createBuffer();
  var zeros = k - Math.ceil(xhex.length / 2);
  while (zeros > 0) {
    eb.putByte(0);
    --zeros;
  }
  eb.putBytes(forge.util.hexToBytes(xhex));
  if (ml !== false) {
    return _decodePkcs1_v1_5(eb.getBytes(), key, pub);
  }
  return eb.getBytes();
};
pki.rsa.createKeyPairGenerationState = function (bits, e, options) {
  if (typeof bits === "string") {
    bits = parseInt(bits, 10);
  }
  bits = bits || 2048;
  options = options || ({});
  var prng = options.prng || forge.random;
  var rng = {
    nextBytes: function (x) {
      var b = prng.getBytesSync(x.length);
      for (var i = 0; i < x.length; ++i) {
        x[i] = b.charCodeAt(i);
      }
    }
  };
  var algorithm = options.algorithm || "PRIMEINC";
  var rval;
  if (algorithm === "PRIMEINC") {
    rval = {
      algorithm: algorithm,
      state: 0,
      bits: bits,
      rng: rng,
      eInt: e || 65537,
      e: new BigInteger(null),
      p: null,
      q: null,
      qBits: bits >> 1,
      pBits: bits - (bits >> 1),
      pqState: 0,
      num: null,
      keys: null
    };
    rval.e.fromInt(rval.eInt);
  } else {
    throw new Error("Invalid key generation algorithm: " + algorithm);
  }
  return rval;
};
pki.rsa.stepKeyPairGenerationState = function (state, n) {
  if (!(("algorithm" in state))) {
    state.algorithm = "PRIMEINC";
  }
  var THIRTY = new BigInteger(null);
  THIRTY.fromInt(30);
  var deltaIdx = 0;
  var op_or = function (x, y) {
    return x | y;
  };
  var t1 = +new Date();
  var t2;
  var total = 0;
  while (state.keys === null && (n <= 0 || total < n)) {
    if (state.state === 0) {
      var bits = state.p === null ? state.pBits : state.qBits;
      var bits1 = bits - 1;
      if (state.pqState === 0) {
        state.num = new BigInteger(bits, state.rng);
        if (!state.num.testBit(bits1)) {
          state.num.bitwiseTo(BigInteger.ONE.shiftLeft(bits1), op_or, state.num);
        }
        state.num.dAddOffset(31 - state.num.mod(THIRTY).byteValue(), 0);
        deltaIdx = 0;
        ++state.pqState;
      } else if (state.pqState === 1) {
        if (state.num.bitLength() > bits) {
          state.pqState = 0;
        } else if (state.num.isProbablePrime(_getMillerRabinTests(state.num.bitLength()))) {
          ++state.pqState;
        } else {
          state.num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
        }
      } else if (state.pqState === 2) {
        state.pqState = state.num.subtract(BigInteger.ONE).gcd(state.e).compareTo(BigInteger.ONE) === 0 ? 3 : 0;
      } else if (state.pqState === 3) {
        state.pqState = 0;
        if (state.p === null) {
          state.p = state.num;
        } else {
          state.q = state.num;
        }
        if (state.p !== null && state.q !== null) {
          ++state.state;
        }
        state.num = null;
      }
    } else if (state.state === 1) {
      if (state.p.compareTo(state.q) < 0) {
        state.num = state.p;
        state.p = state.q;
        state.q = state.num;
      }
      ++state.state;
    } else if (state.state === 2) {
      state.p1 = state.p.subtract(BigInteger.ONE);
      state.q1 = state.q.subtract(BigInteger.ONE);
      state.phi = state.p1.multiply(state.q1);
      ++state.state;
    } else if (state.state === 3) {
      if (state.phi.gcd(state.e).compareTo(BigInteger.ONE) === 0) {
        ++state.state;
      } else {
        state.p = null;
        state.q = null;
        state.state = 0;
      }
    } else if (state.state === 4) {
      state.n = state.p.multiply(state.q);
      if (state.n.bitLength() === state.bits) {
        ++state.state;
      } else {
        state.q = null;
        state.state = 0;
      }
    } else if (state.state === 5) {
      var d = state.e.modInverse(state.phi);
      state.keys = {
        privateKey: pki.rsa.setPrivateKey(state.n, state.e, d, state.p, state.q, d.mod(state.p1), d.mod(state.q1), state.q.modInverse(state.p)),
        publicKey: pki.rsa.setPublicKey(state.n, state.e)
      };
    }
    t2 = +new Date();
    total += t2 - t1;
    t1 = t2;
  }
  return state.keys !== null;
};
pki.rsa.generateKeyPair = function (bits, e, options, callback) {
  if (arguments.length === 1) {
    if (typeof bits === "object") {
      options = bits;
      bits = undefined;
    } else if (typeof bits === "function") {
      callback = bits;
      bits = undefined;
    }
  } else if (arguments.length === 2) {
    if (typeof bits === "number") {
      if (typeof e === "function") {
        callback = e;
        e = undefined;
      } else if (typeof e !== "number") {
        options = e;
        e = undefined;
      }
    } else {
      options = bits;
      callback = e;
      bits = undefined;
      e = undefined;
    }
  } else if (arguments.length === 3) {
    if (typeof e === "number") {
      if (typeof options === "function") {
        callback = options;
        options = undefined;
      }
    } else {
      callback = options;
      options = e;
      e = undefined;
    }
  }
  options = options || ({});
  if (bits === undefined) {
    bits = options.bits || 2048;
  }
  if (e === undefined) {
    e = options.e || 65537;
  }
  if (!forge.disableNativeCode && callback && bits >= 256 && bits <= 16384 && (e === 65537 || e === 3)) {
    if (_detectSubtleCrypto("generateKey") && _detectSubtleCrypto("exportKey")) {
      return window.crypto.subtle.generateKey({
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: bits,
        publicExponent: _intToUint8Array(e),
        hash: {
          name: "SHA-256"
        }
      }, true, ["sign", "verify"]).then(function (pair) {
        return window.crypto.subtle.exportKey("pkcs8", pair.privateKey);
      }).catch(function (err) {
        callback(err);
      }).then(function (pkcs8) {
        if (pkcs8) {
          var privateKey = pki.privateKeyFromAsn1(asn1.fromDer(forge.util.createBuffer(pkcs8)));
          callback(null, {
            privateKey: privateKey,
            publicKey: pki.setRsaPublicKey(privateKey.n, privateKey.e)
          });
        }
      });
    }
    if (_detectSubtleMsCrypto("generateKey") && _detectSubtleMsCrypto("exportKey")) {
      var genOp = window.msCrypto.subtle.generateKey({
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: bits,
        publicExponent: _intToUint8Array(e),
        hash: {
          name: "SHA-256"
        }
      }, true, ["sign", "verify"]);
      genOp.oncomplete = function (e) {
        var pair = e.target.result;
        var exportOp = window.msCrypto.subtle.exportKey("pkcs8", pair.privateKey);
        exportOp.oncomplete = function (e) {
          var pkcs8 = e.target.result;
          var privateKey = pki.privateKeyFromAsn1(asn1.fromDer(forge.util.createBuffer(pkcs8)));
          callback(null, {
            privateKey: privateKey,
            publicKey: pki.setRsaPublicKey(privateKey.n, privateKey.e)
          });
        };
        exportOp.onerror = function (err) {
          callback(err);
        };
      };
      genOp.onerror = function (err) {
        callback(err);
      };
      return;
    }
  }
  var state = pki.rsa.createKeyPairGenerationState(bits, e, options);
  if (!callback) {
    pki.rsa.stepKeyPairGenerationState(state, 0);
    return state.keys;
  }
  _generateKeyPair(state, options, callback);
};
pki.setRsaPublicKey = pki.rsa.setPublicKey = function (n, e) {
  var key = {
    n: n,
    e: e
  };
  key.encrypt = function (data, scheme, schemeOptions) {
    if (typeof scheme === "string") {
      scheme = scheme.toUpperCase();
    } else if (scheme === undefined) {
      scheme = "RSAES-PKCS1-V1_5";
    }
    if (scheme === "RSAES-PKCS1-V1_5") {
      scheme = {
        encode: function (m, key, pub) {
          return _encodePkcs1_v1_5(m, key, 2).getBytes();
        }
      };
    } else if (scheme === "RSA-OAEP" || scheme === "RSAES-OAEP") {
      scheme = {
        encode: function (m, key) {
          return forge.pkcs1.encode_rsa_oaep(key, m, schemeOptions);
        }
      };
    } else if (["RAW", "NONE", "NULL", null].indexOf(scheme) !== -1) {
      scheme = {
        encode: function (e) {
          return e;
        }
      };
    } else if (typeof scheme === "string") {
      throw new Error("Unsupported encryption scheme: \"" + scheme + "\".");
    }
    var e = scheme.encode(data, key, true);
    return pki.rsa.encrypt(e, key, true);
  };
  key.verify = function (digest, signature, scheme) {
    if (typeof scheme === "string") {
      scheme = scheme.toUpperCase();
    } else if (scheme === undefined) {
      scheme = "RSASSA-PKCS1-V1_5";
    }
    if (scheme === "RSASSA-PKCS1-V1_5") {
      scheme = {
        verify: function (digest, d) {
          d = _decodePkcs1_v1_5(d, key, true);
          var obj = asn1.fromDer(d);
          return digest === obj.value[1].value;
        }
      };
    } else if (scheme === "NONE" || scheme === "NULL" || scheme === null) {
      scheme = {
        verify: function (digest, d) {
          d = _decodePkcs1_v1_5(d, key, true);
          return digest === d;
        }
      };
    }
    var d = pki.rsa.decrypt(signature, key, true, false);
    return scheme.verify(digest, d, key.n.bitLength());
  };
  return key;
};
pki.setRsaPrivateKey = pki.rsa.setPrivateKey = function (n, e, d, p, q, dP, dQ, qInv) {
  var key = {
    n: n,
    e: e,
    d: d,
    p: p,
    q: q,
    dP: dP,
    dQ: dQ,
    qInv: qInv
  };
  key.decrypt = function (data, scheme, schemeOptions) {
    if (typeof scheme === "string") {
      scheme = scheme.toUpperCase();
    } else if (scheme === undefined) {
      scheme = "RSAES-PKCS1-V1_5";
    }
    var d = pki.rsa.decrypt(data, key, false, false);
    if (scheme === "RSAES-PKCS1-V1_5") {
      scheme = {
        decode: _decodePkcs1_v1_5
      };
    } else if (scheme === "RSA-OAEP" || scheme === "RSAES-OAEP") {
      scheme = {
        decode: function (d, key) {
          return forge.pkcs1.decode_rsa_oaep(key, d, schemeOptions);
        }
      };
    } else if (["RAW", "NONE", "NULL", null].indexOf(scheme) !== -1) {
      scheme = {
        decode: function (d) {
          return d;
        }
      };
    } else {
      throw new Error("Unsupported encryption scheme: \"" + scheme + "\".");
    }
    return scheme.decode(d, key, false);
  };
  key.sign = function (md, scheme) {
    var bt = false;
    if (typeof scheme === "string") {
      scheme = scheme.toUpperCase();
    }
    if (scheme === undefined || scheme === "RSASSA-PKCS1-V1_5") {
      scheme = {
        encode: emsaPkcs1v15encode
      };
      bt = 1;
    } else if (scheme === "NONE" || scheme === "NULL" || scheme === null) {
      scheme = {
        encode: function () {
          return md;
        }
      };
      bt = 1;
    }
    var d = scheme.encode(md, key.n.bitLength());
    return pki.rsa.encrypt(d, key, bt);
  };
  return key;
};
pki.wrapRsaPrivateKey = function (rsaKey) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(0).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.rsaEncryption).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, asn1.toDer(rsaKey).getBytes())]);
};
pki.privateKeyFromAsn1 = function (obj) {
  var capture = {};
  var errors = [];
  if (asn1.validate(obj, privateKeyValidator, capture, errors)) {
    obj = asn1.fromDer(forge.util.createBuffer(capture.privateKey));
  }
  capture = {};
  errors = [];
  if (!asn1.validate(obj, rsaPrivateKeyValidator, capture, errors)) {
    var error = new Error("Cannot read private key. " + "ASN.1 object does not contain an RSAPrivateKey.");
    error.errors = errors;
    throw error;
  }
  var n, e, d, p, q, dP, dQ, qInv;
  n = forge.util.createBuffer(capture.privateKeyModulus).toHex();
  e = forge.util.createBuffer(capture.privateKeyPublicExponent).toHex();
  d = forge.util.createBuffer(capture.privateKeyPrivateExponent).toHex();
  p = forge.util.createBuffer(capture.privateKeyPrime1).toHex();
  q = forge.util.createBuffer(capture.privateKeyPrime2).toHex();
  dP = forge.util.createBuffer(capture.privateKeyExponent1).toHex();
  dQ = forge.util.createBuffer(capture.privateKeyExponent2).toHex();
  qInv = forge.util.createBuffer(capture.privateKeyCoefficient).toHex();
  return pki.setRsaPrivateKey(new BigInteger(n, 16), new BigInteger(e, 16), new BigInteger(d, 16), new BigInteger(p, 16), new BigInteger(q, 16), new BigInteger(dP, 16), new BigInteger(dQ, 16), new BigInteger(qInv, 16));
};
pki.privateKeyToAsn1 = pki.privateKeyToRSAPrivateKey = function (key) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(0).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.n)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.e)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.d)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.p)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.q)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.dP)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.dQ)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.qInv))]);
};
pki.publicKeyFromAsn1 = function (obj) {
  var capture = {};
  var errors = [];
  if (asn1.validate(obj, publicKeyValidator, capture, errors)) {
    var oid = asn1.derToOid(capture.publicKeyOid);
    if (oid !== pki.oids.rsaEncryption) {
      var error = new Error("Cannot read public key. Unknown OID.");
      error.oid = oid;
      throw error;
    }
    obj = capture.rsaPublicKey;
  }
  errors = [];
  if (!asn1.validate(obj, rsaPublicKeyValidator, capture, errors)) {
    var error = new Error("Cannot read public key. " + "ASN.1 object does not contain an RSAPublicKey.");
    error.errors = errors;
    throw error;
  }
  var n = forge.util.createBuffer(capture.publicKeyModulus).toHex();
  var e = forge.util.createBuffer(capture.publicKeyExponent).toHex();
  return pki.setRsaPublicKey(new BigInteger(n, 16), new BigInteger(e, 16));
};
pki.publicKeyToAsn1 = pki.publicKeyToSubjectPublicKeyInfo = function (key) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.rsaEncryption).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, [pki.publicKeyToRSAPublicKey(key)])]);
};
pki.publicKeyToRSAPublicKey = function (key) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.n)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, _bnToBytes(key.e))]);
};
function _encodePkcs1_v1_5(m, key, bt) {
  var eb = forge.util.createBuffer();
  var k = Math.ceil(key.n.bitLength() / 8);
  if (m.length > k - 11) {
    var error = new Error("Message is too long for PKCS#1 v1.5 padding.");
    error.length = m.length;
    error.max = k - 11;
    throw error;
  }
  eb.putByte(0);
  eb.putByte(bt);
  var padNum = k - 3 - m.length;
  var padByte;
  if (bt === 0 || bt === 1) {
    padByte = bt === 0 ? 0 : 255;
    for (var i = 0; i < padNum; ++i) {
      eb.putByte(padByte);
    }
  } else {
    while (padNum > 0) {
      var numZeros = 0;
      var padBytes = forge.random.getBytes(padNum);
      for (var i = 0; i < padNum; ++i) {
        padByte = padBytes.charCodeAt(i);
        if (padByte === 0) {
          ++numZeros;
        } else {
          eb.putByte(padByte);
        }
      }
      padNum = numZeros;
    }
  }
  eb.putByte(0);
  eb.putBytes(m);
  return eb;
}
function _decodePkcs1_v1_5(em, key, pub, ml) {
  var k = Math.ceil(key.n.bitLength() / 8);
  var eb = forge.util.createBuffer(em);
  var first = eb.getByte();
  var bt = eb.getByte();
  if (first !== 0 || pub && bt !== 0 && bt !== 1 || !pub && bt != 2 || pub && bt === 0 && typeof ml === "undefined") {
    throw new Error("Encryption block is invalid.");
  }
  var padNum = 0;
  if (bt === 0) {
    padNum = k - 3 - ml;
    for (var i = 0; i < padNum; ++i) {
      if (eb.getByte() !== 0) {
        throw new Error("Encryption block is invalid.");
      }
    }
  } else if (bt === 1) {
    padNum = 0;
    while (eb.length() > 1) {
      if (eb.getByte() !== 255) {
        --eb.read;
        break;
      }
      ++padNum;
    }
  } else if (bt === 2) {
    padNum = 0;
    while (eb.length() > 1) {
      if (eb.getByte() === 0) {
        --eb.read;
        break;
      }
      ++padNum;
    }
  }
  var zero = eb.getByte();
  if (zero !== 0 || padNum !== k - 3 - eb.length()) {
    throw new Error("Encryption block is invalid.");
  }
  return eb.getBytes();
}
function _generateKeyPair(state, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || ({});
  var opts = {
    algorithm: {
      name: options.algorithm || "PRIMEINC",
      options: {
        workers: options.workers || 2,
        workLoad: options.workLoad || 100,
        workerScript: options.workerScript
      }
    }
  };
  if (("prng" in options)) {
    opts.prng = options.prng;
  }
  generate();
  function generate() {
    getPrime(state.pBits, function (err, num) {
      if (err) {
        return callback(err);
      }
      state.p = num;
      if (state.q !== null) {
        return finish(err, state.q);
      }
      getPrime(state.qBits, finish);
    });
  }
  function getPrime(bits, callback) {
    forge.prime.generateProbablePrime(bits, opts, callback);
  }
  function finish(err, num) {
    if (err) {
      return callback(err);
    }
    state.q = num;
    if (state.p.compareTo(state.q) < 0) {
      var tmp = state.p;
      state.p = state.q;
      state.q = tmp;
    }
    if (state.p.subtract(BigInteger.ONE).gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
      state.p = null;
      generate();
      return;
    }
    if (state.q.subtract(BigInteger.ONE).gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
      state.q = null;
      getPrime(state.qBits, finish);
      return;
    }
    state.p1 = state.p.subtract(BigInteger.ONE);
    state.q1 = state.q.subtract(BigInteger.ONE);
    state.phi = state.p1.multiply(state.q1);
    if (state.phi.gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
      state.p = state.q = null;
      generate();
      return;
    }
    state.n = state.p.multiply(state.q);
    if (state.n.bitLength() !== state.bits) {
      state.q = null;
      getPrime(state.qBits, finish);
      return;
    }
    var d = state.e.modInverse(state.phi);
    state.keys = {
      privateKey: pki.rsa.setPrivateKey(state.n, state.e, d, state.p, state.q, d.mod(state.p1), d.mod(state.q1), state.q.modInverse(state.p)),
      publicKey: pki.rsa.setPublicKey(state.n, state.e)
    };
    callback(null, state.keys);
  }
}
function _bnToBytes(b) {
  var hex = b.toString(16);
  if (hex[0] >= "8") {
    hex = "00" + hex;
  }
  var bytes = forge.util.hexToBytes(hex);
  if (bytes.length > 1 && (bytes.charCodeAt(0) === 0 && (bytes.charCodeAt(1) & 128) === 0 || bytes.charCodeAt(0) === 255 && (bytes.charCodeAt(1) & 128) === 128)) {
    return bytes.substr(1);
  }
  return bytes;
}
function _getMillerRabinTests(bits) {
  if (bits <= 100) return 27;
  if (bits <= 150) return 18;
  if (bits <= 200) return 15;
  if (bits <= 250) return 12;
  if (bits <= 300) return 9;
  if (bits <= 350) return 8;
  if (bits <= 400) return 7;
  if (bits <= 500) return 6;
  if (bits <= 600) return 5;
  if (bits <= 800) return 4;
  if (bits <= 1250) return 3;
  return 2;
}
function _detectSubtleCrypto(fn) {
  return typeof window !== "undefined" && typeof window.crypto === "object" && typeof window.crypto.subtle === "object" && typeof window.crypto.subtle[fn] === "function";
}
function _detectSubtleMsCrypto(fn) {
  return typeof window !== "undefined" && typeof window.msCrypto === "object" && typeof window.msCrypto.subtle === "object" && typeof window.msCrypto.subtle[fn] === "function";
}
function _intToUint8Array(x) {
  var bytes = forge.util.hexToBytes(x.toString(16));
  var buffer = new Uint8Array(bytes.length);
  for (var i = 0; i < bytes.length; ++i) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return buffer;
}

export { forge as default };
