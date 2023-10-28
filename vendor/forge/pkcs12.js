import 'module';
import './asn1.js';
import './hmac.js';
import './oids.js';
import './pkcs7asn1.js';
import './pbe.js';
import './random.js';
import './rsa.js';
import './sha1.js';
import './util.js';
import './x509.js';

var forge = global.forge;
var asn1 = forge.asn1;
var pki = forge.pki;
var p12 = forge.pkcs12 = forge.pkcs12 || ({});
var contentInfoValidator = {
  name: "ContentInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "ContentInfo.contentType",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OID,
    constructed: false,
    capture: "contentType"
  }, {
    name: "ContentInfo.content",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    constructed: true,
    captureAsn1: "content"
  }]
};
var pfxValidator = {
  name: "PFX",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "PFX.version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "version"
  }, contentInfoValidator, {
    name: "PFX.macData",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    optional: true,
    captureAsn1: "mac",
    value: [{
      name: "PFX.macData.mac",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "PFX.macData.mac.digestAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "PFX.macData.mac.digestAlgorithm.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "macAlgorithm"
        }, {
          name: "PFX.macData.mac.digestAlgorithm.parameters",
          tagClass: asn1.Class.UNIVERSAL,
          captureAsn1: "macAlgorithmParameters"
        }]
      }, {
        name: "PFX.macData.mac.digest",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "macDigest"
      }]
    }, {
      name: "PFX.macData.macSalt",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OCTETSTRING,
      constructed: false,
      capture: "macSalt"
    }, {
      name: "PFX.macData.iterations",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.INTEGER,
      constructed: false,
      optional: true,
      capture: "macIterations"
    }]
  }]
};
var safeBagValidator = {
  name: "SafeBag",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "SafeBag.bagId",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OID,
    constructed: false,
    capture: "bagId"
  }, {
    name: "SafeBag.bagValue",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    constructed: true,
    captureAsn1: "bagValue"
  }, {
    name: "SafeBag.bagAttributes",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SET,
    constructed: true,
    optional: true,
    capture: "bagAttributes"
  }]
};
var attributeValidator = {
  name: "Attribute",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "Attribute.attrId",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OID,
    constructed: false,
    capture: "oid"
  }, {
    name: "Attribute.attrValues",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SET,
    constructed: true,
    capture: "values"
  }]
};
var certBagValidator = {
  name: "CertBag",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "CertBag.certId",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OID,
    constructed: false,
    capture: "certId"
  }, {
    name: "CertBag.certValue",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    constructed: true,
    value: [{
      name: "CertBag.certValue[0]",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Class.OCTETSTRING,
      constructed: false,
      capture: "cert"
    }]
  }]
};
function _getBagsByAttribute(safeContents, attrName, attrValue, bagType) {
  var result = [];
  for (var i = 0; i < safeContents.length; i++) {
    for (var j = 0; j < safeContents[i].safeBags.length; j++) {
      var bag = safeContents[i].safeBags[j];
      if (bagType !== undefined && bag.type !== bagType) {
        continue;
      }
      if (attrName === null) {
        result.push(bag);
        continue;
      }
      if (bag.attributes[attrName] !== undefined && bag.attributes[attrName].indexOf(attrValue) >= 0) {
        result.push(bag);
      }
    }
  }
  return result;
}
p12.pkcs12FromAsn1 = function (obj, strict, password) {
  if (typeof strict === "string") {
    password = strict;
    strict = true;
  } else if (strict === undefined) {
    strict = true;
  }
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, pfxValidator, capture, errors)) {
    var error = new Error("Cannot read PKCS#12 PFX. " + "ASN.1 object is not an PKCS#12 PFX.");
    error.errors = error;
    throw error;
  }
  var pfx = {
    version: capture.version.charCodeAt(0),
    safeContents: [],
    getBags: function (filter) {
      var rval = {};
      var localKeyId;
      if (("localKeyId" in filter)) {
        localKeyId = filter.localKeyId;
      } else if (("localKeyIdHex" in filter)) {
        localKeyId = forge.util.hexToBytes(filter.localKeyIdHex);
      }
      if (localKeyId === undefined && !(("friendlyName" in filter)) && ("bagType" in filter)) {
        rval[filter.bagType] = _getBagsByAttribute(pfx.safeContents, null, null, filter.bagType);
      }
      if (localKeyId !== undefined) {
        rval.localKeyId = _getBagsByAttribute(pfx.safeContents, "localKeyId", localKeyId, filter.bagType);
      }
      if (("friendlyName" in filter)) {
        rval.friendlyName = _getBagsByAttribute(pfx.safeContents, "friendlyName", filter.friendlyName, filter.bagType);
      }
      return rval;
    },
    getBagsByFriendlyName: function (friendlyName, bagType) {
      return _getBagsByAttribute(pfx.safeContents, "friendlyName", friendlyName, bagType);
    },
    getBagsByLocalKeyId: function (localKeyId, bagType) {
      return _getBagsByAttribute(pfx.safeContents, "localKeyId", localKeyId, bagType);
    }
  };
  if (capture.version.charCodeAt(0) !== 3) {
    var error = new Error("PKCS#12 PFX of version other than 3 not supported.");
    error.version = capture.version.charCodeAt(0);
    throw error;
  }
  if (asn1.derToOid(capture.contentType) !== pki.oids.data) {
    var error = new Error("Only PKCS#12 PFX in password integrity mode supported.");
    error.oid = asn1.derToOid(capture.contentType);
    throw error;
  }
  var data = capture.content.value[0];
  if (data.tagClass !== asn1.Class.UNIVERSAL || data.type !== asn1.Type.OCTETSTRING) {
    throw new Error("PKCS#12 authSafe content data is not an OCTET STRING.");
  }
  data = _decodePkcs7Data(data);
  if (capture.mac) {
    var md = null;
    var macKeyBytes = 0;
    var macAlgorithm = asn1.derToOid(capture.macAlgorithm);
    switch (macAlgorithm) {
      case pki.oids.sha1:
        md = forge.md.sha1.create();
        macKeyBytes = 20;
        break;
      case pki.oids.sha256:
        md = forge.md.sha256.create();
        macKeyBytes = 32;
        break;
      case pki.oids.sha384:
        md = forge.md.sha384.create();
        macKeyBytes = 48;
        break;
      case pki.oids.sha512:
        md = forge.md.sha512.create();
        macKeyBytes = 64;
        break;
      case pki.oids.md5:
        md = forge.md.md5.create();
        macKeyBytes = 16;
        break;
    }
    if (md === null) {
      throw new Error("PKCS#12 uses unsupported MAC algorithm: " + macAlgorithm);
    }
    var macSalt = new forge.util.ByteBuffer(capture.macSalt);
    var macIterations = ("macIterations" in capture) ? parseInt(forge.util.bytesToHex(capture.macIterations), 16) : 1;
    var macKey = p12.generateKey(password, macSalt, 3, macIterations, macKeyBytes, md);
    var mac = forge.hmac.create();
    mac.start(md, macKey);
    mac.update(data.value);
    var macValue = mac.getMac();
    if (macValue.getBytes() !== capture.macDigest) {
      throw new Error("PKCS#12 MAC could not be verified. Invalid password?");
    }
  }
  _decodeAuthenticatedSafe(pfx, data.value, strict, password);
  return pfx;
};
function _decodePkcs7Data(data) {
  if (data.composed || data.constructed) {
    var value = forge.util.createBuffer();
    for (var i = 0; i < data.value.length; ++i) {
      value.putBytes(data.value[i].value);
    }
    data.composed = data.constructed = false;
    data.value = value.getBytes();
  }
  return data;
}
function _decodeAuthenticatedSafe(pfx, authSafe, strict, password) {
  authSafe = asn1.fromDer(authSafe, strict);
  if (authSafe.tagClass !== asn1.Class.UNIVERSAL || authSafe.type !== asn1.Type.SEQUENCE || authSafe.constructed !== true) {
    throw new Error("PKCS#12 AuthenticatedSafe expected to be a " + "SEQUENCE OF ContentInfo");
  }
  for (var i = 0; i < authSafe.value.length; i++) {
    var contentInfo = authSafe.value[i];
    var capture = {};
    var errors = [];
    if (!asn1.validate(contentInfo, contentInfoValidator, capture, errors)) {
      var error = new Error("Cannot read ContentInfo.");
      error.errors = errors;
      throw error;
    }
    var obj = {
      encrypted: false
    };
    var safeContents = null;
    var data = capture.content.value[0];
    switch (asn1.derToOid(capture.contentType)) {
      case pki.oids.data:
        if (data.tagClass !== asn1.Class.UNIVERSAL || data.type !== asn1.Type.OCTETSTRING) {
          throw new Error("PKCS#12 SafeContents Data is not an OCTET STRING.");
        }
        safeContents = _decodePkcs7Data(data).value;
        break;
      case pki.oids.encryptedData:
        safeContents = _decryptSafeContents(data, password);
        obj.encrypted = true;
        break;
      default:
        var error = new Error("Unsupported PKCS#12 contentType.");
        error.contentType = asn1.derToOid(capture.contentType);
        throw error;
    }
    obj.safeBags = _decodeSafeContents(safeContents, strict, password);
    pfx.safeContents.push(obj);
  }
}
function _decryptSafeContents(data, password) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(data, forge.pkcs7.asn1.encryptedDataValidator, capture, errors)) {
    var error = new Error("Cannot read EncryptedContentInfo.");
    error.errors = errors;
    throw error;
  }
  var oid = asn1.derToOid(capture.contentType);
  if (oid !== pki.oids.data) {
    var error = new Error("PKCS#12 EncryptedContentInfo ContentType is not Data.");
    error.oid = oid;
    throw error;
  }
  oid = asn1.derToOid(capture.encAlgorithm);
  var cipher = pki.pbe.getCipher(oid, capture.encParameter, password);
  var encryptedContentAsn1 = _decodePkcs7Data(capture.encryptedContentAsn1);
  var encrypted = forge.util.createBuffer(encryptedContentAsn1.value);
  cipher.update(encrypted);
  if (!cipher.finish()) {
    throw new Error("Failed to decrypt PKCS#12 SafeContents.");
  }
  return cipher.output.getBytes();
}
function _decodeSafeContents(safeContents, strict, password) {
  if (!strict && safeContents.length === 0) {
    return [];
  }
  safeContents = asn1.fromDer(safeContents, strict);
  if (safeContents.tagClass !== asn1.Class.UNIVERSAL || safeContents.type !== asn1.Type.SEQUENCE || safeContents.constructed !== true) {
    throw new Error("PKCS#12 SafeContents expected to be a SEQUENCE OF SafeBag.");
  }
  var res = [];
  for (var i = 0; i < safeContents.value.length; i++) {
    var safeBag = safeContents.value[i];
    var capture = {};
    var errors = [];
    if (!asn1.validate(safeBag, safeBagValidator, capture, errors)) {
      var error = new Error("Cannot read SafeBag.");
      error.errors = errors;
      throw error;
    }
    var bag = {
      type: asn1.derToOid(capture.bagId),
      attributes: _decodeBagAttributes(capture.bagAttributes)
    };
    res.push(bag);
    var validator, decoder;
    var bagAsn1 = capture.bagValue.value[0];
    switch (bag.type) {
      case pki.oids.pkcs8ShroudedKeyBag:
        bagAsn1 = pki.decryptPrivateKeyInfo(bagAsn1, password);
        if (bagAsn1 === null) {
          throw new Error("Unable to decrypt PKCS#8 ShroudedKeyBag, wrong password?");
        }
      case pki.oids.keyBag:
        try {
          bag.key = pki.privateKeyFromAsn1(bagAsn1);
        } catch (e) {
          bag.key = null;
          bag.asn1 = bagAsn1;
        }
        continue;
      case pki.oids.certBag:
        validator = certBagValidator;
        decoder = function () {
          if (asn1.derToOid(capture.certId) !== pki.oids.x509Certificate) {
            var error = new Error("Unsupported certificate type, only X.509 supported.");
            error.oid = asn1.derToOid(capture.certId);
            throw error;
          }
          var certAsn1 = asn1.fromDer(capture.cert, strict);
          try {
            bag.cert = pki.certificateFromAsn1(certAsn1, true);
          } catch (e) {
            bag.cert = null;
            bag.asn1 = certAsn1;
          }
        };
        break;
      default:
        var error = new Error("Unsupported PKCS#12 SafeBag type.");
        error.oid = bag.type;
        throw error;
    }
    if (validator !== undefined && !asn1.validate(bagAsn1, validator, capture, errors)) {
      var error = new Error("Cannot read PKCS#12 " + validator.name);
      error.errors = errors;
      throw error;
    }
    decoder();
  }
  return res;
}
function _decodeBagAttributes(attributes) {
  var decodedAttrs = {};
  if (attributes !== undefined) {
    for (var i = 0; i < attributes.length; ++i) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(attributes[i], attributeValidator, capture, errors)) {
        var error = new Error("Cannot read PKCS#12 BagAttribute.");
        error.errors = errors;
        throw error;
      }
      var oid = asn1.derToOid(capture.oid);
      if (pki.oids[oid] === undefined) {
        continue;
      }
      decodedAttrs[pki.oids[oid]] = [];
      for (var j = 0; j < capture.values.length; ++j) {
        decodedAttrs[pki.oids[oid]].push(capture.values[j].value);
      }
    }
  }
  return decodedAttrs;
}
p12.toPkcs12Asn1 = function (key, cert, password, options) {
  options = options || ({});
  options.saltSize = options.saltSize || 8;
  options.count = options.count || 2048;
  options.algorithm = options.algorithm || options.encAlgorithm || "aes128";
  if (!(("useMac" in options))) {
    options.useMac = true;
  }
  if (!(("localKeyId" in options))) {
    options.localKeyId = null;
  }
  if (!(("generateLocalKeyId" in options))) {
    options.generateLocalKeyId = true;
  }
  var localKeyId = options.localKeyId;
  var bagAttrs;
  if (localKeyId !== null) {
    localKeyId = forge.util.hexToBytes(localKeyId);
  } else if (options.generateLocalKeyId) {
    if (cert) {
      var pairedCert = forge.util.isArray(cert) ? cert[0] : cert;
      if (typeof pairedCert === "string") {
        pairedCert = pki.certificateFromPem(pairedCert);
      }
      var sha1 = forge.md.sha1.create();
      sha1.update(asn1.toDer(pki.certificateToAsn1(pairedCert)).getBytes());
      localKeyId = sha1.digest().getBytes();
    } else {
      localKeyId = forge.random.getBytes(20);
    }
  }
  var attrs = [];
  if (localKeyId !== null) {
    attrs.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.localKeyId).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, localKeyId)])]));
  }
  if (("friendlyName" in options)) {
    attrs.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.friendlyName).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BMPSTRING, false, options.friendlyName)])]));
  }
  if (attrs.length > 0) {
    bagAttrs = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, attrs);
  }
  var contents = [];
  var chain = [];
  if (cert !== null) {
    if (forge.util.isArray(cert)) {
      chain = cert;
    } else {
      chain = [cert];
    }
  }
  var certSafeBags = [];
  for (var i = 0; i < chain.length; ++i) {
    cert = chain[i];
    if (typeof cert === "string") {
      cert = pki.certificateFromPem(cert);
    }
    var certBagAttrs = i === 0 ? bagAttrs : undefined;
    var certAsn1 = pki.certificateToAsn1(cert);
    var certSafeBag = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.certBag).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.x509Certificate).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, asn1.toDer(certAsn1).getBytes())])])]), certBagAttrs]);
    certSafeBags.push(certSafeBag);
  }
  if (certSafeBags.length > 0) {
    var certSafeContents = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, certSafeBags);
    var certCI = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.data).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, asn1.toDer(certSafeContents).getBytes())])]);
    contents.push(certCI);
  }
  var keyBag = null;
  if (key !== null) {
    var pkAsn1 = pki.wrapRsaPrivateKey(pki.privateKeyToAsn1(key));
    if (password === null) {
      keyBag = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.keyBag).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [pkAsn1]), bagAttrs]);
    } else {
      keyBag = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.pkcs8ShroudedKeyBag).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [pki.encryptPrivateKeyInfo(pkAsn1, password, options)]), bagAttrs]);
    }
    var keySafeContents = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [keyBag]);
    var keyCI = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.data).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, asn1.toDer(keySafeContents).getBytes())])]);
    contents.push(keyCI);
  }
  var safe = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, contents);
  var macData;
  if (options.useMac) {
    var sha1 = forge.md.sha1.create();
    var macSalt = new forge.util.ByteBuffer(forge.random.getBytes(options.saltSize));
    var count = options.count;
    var key = p12.generateKey(password, macSalt, 3, count, 20);
    var mac = forge.hmac.create();
    mac.start(sha1, key);
    mac.update(asn1.toDer(safe).getBytes());
    var macValue = mac.getMac();
    macData = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.sha1).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, macValue.getBytes())]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, macSalt.getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(count).getBytes())]);
  }
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(3).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(pki.oids.data).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, asn1.toDer(safe).getBytes())])]), macData]);
};
p12.generateKey = forge.pbe.generatePkcs12Key;

export { forge as default };
