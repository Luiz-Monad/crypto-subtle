import 'module';
import './aes.js';
import './asn1.js';
import './des.js';
import './oids.js';
import './pem.js';
import './pkcs7asn1.js';
import './random.js';
import './util.js';
import './x509.js';

var forge = global.forge;
var asn1 = forge.asn1;
var p7 = forge.pkcs7 = forge.pkcs7 || ({});
p7.messageFromPem = function (pem) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "PKCS7") {
    var error = new Error("Could not convert PKCS#7 message from PEM; PEM " + "header type is not \"PKCS#7\".");
    error.headerType = msg.type;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert PKCS#7 message from PEM; PEM is encrypted.");
  }
  var obj = asn1.fromDer(msg.body);
  return p7.messageFromAsn1(obj);
};
p7.messageToPem = function (msg, maxline) {
  var pemObj = {
    type: "PKCS7",
    body: asn1.toDer(msg.toAsn1()).getBytes()
  };
  return forge.pem.encode(pemObj, {
    maxline: maxline
  });
};
p7.messageFromAsn1 = function (obj) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, p7.asn1.contentInfoValidator, capture, errors)) {
    var error = new Error("Cannot read PKCS#7 message. " + "ASN.1 object is not an PKCS#7 ContentInfo.");
    error.errors = errors;
    throw error;
  }
  var contentType = asn1.derToOid(capture.contentType);
  var msg;
  switch (contentType) {
    case forge.pki.oids.envelopedData:
      msg = p7.createEnvelopedData();
      break;
    case forge.pki.oids.encryptedData:
      msg = p7.createEncryptedData();
      break;
    case forge.pki.oids.signedData:
      msg = p7.createSignedData();
      break;
    default:
      throw new Error("Cannot read PKCS#7 message. ContentType with OID " + contentType + " is not (yet) supported.");
  }
  msg.fromAsn1(capture.content.value[0]);
  return msg;
};
p7.createSignedData = function () {
  var msg = null;
  msg = {
    type: forge.pki.oids.signedData,
    version: 1,
    certificates: [],
    crls: [],
    signers: [],
    digestAlgorithmIdentifiers: [],
    contentInfo: null,
    signerInfos: [],
    fromAsn1: function (obj) {
      _fromAsn1(msg, obj, p7.asn1.signedDataValidator);
      msg.certificates = [];
      msg.crls = [];
      msg.digestAlgorithmIdentifiers = [];
      msg.contentInfo = null;
      msg.signerInfos = [];
      var certs = msg.rawCapture.certificates.value;
      for (var i = 0; i < certs.length; ++i) {
        msg.certificates.push(forge.pki.certificateFromAsn1(certs[i]));
      }
    },
    toAsn1: function () {
      if (!msg.contentInfo) {
        msg.sign();
      }
      var certs = [];
      for (var i = 0; i < msg.certificates.length; ++i) {
        certs.push(forge.pki.certificateToAsn1(msg.certificates[i]));
      }
      var crls = [];
      var signedData = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(msg.version).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, msg.digestAlgorithmIdentifiers), msg.contentInfo])]);
      if (certs.length > 0) {
        signedData.value[0].value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, certs));
      }
      if (crls.length > 0) {
        signedData.value[0].value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, crls));
      }
      signedData.value[0].value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, msg.signerInfos));
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(msg.type).getBytes()), signedData]);
    },
    addSigner: function (signer) {
      var issuer = signer.issuer;
      var serialNumber = signer.serialNumber;
      if (signer.certificate) {
        var cert = signer.certificate;
        if (typeof cert === "string") {
          cert = forge.pki.certificateFromPem(cert);
        }
        issuer = cert.issuer.attributes;
        serialNumber = cert.serialNumber;
      }
      var key = signer.key;
      if (!key) {
        throw new Error("Could not add PKCS#7 signer; no private key specified.");
      }
      if (typeof key === "string") {
        key = forge.pki.privateKeyFromPem(key);
      }
      var digestAlgorithm = signer.digestAlgorithm || forge.pki.oids.sha1;
      switch (digestAlgorithm) {
        case forge.pki.oids.sha1:
        case forge.pki.oids.sha256:
        case forge.pki.oids.sha384:
        case forge.pki.oids.sha512:
        case forge.pki.oids.md5:
          break;
        default:
          throw new Error("Could not add PKCS#7 signer; unknown message digest algorithm: " + digestAlgorithm);
      }
      var authenticatedAttributes = signer.authenticatedAttributes || [];
      if (authenticatedAttributes.length > 0) {
        var contentType = false;
        var messageDigest = false;
        for (var i = 0; i < authenticatedAttributes.length; ++i) {
          var attr = authenticatedAttributes[i];
          if (!contentType && attr.type === forge.pki.oids.contentType) {
            contentType = true;
            if (messageDigest) {
              break;
            }
            continue;
          }
          if (!messageDigest && attr.type === forge.pki.oids.messageDigest) {
            messageDigest = true;
            if (contentType) {
              break;
            }
            continue;
          }
        }
        if (!contentType || !messageDigest) {
          throw new Error("Invalid signer.authenticatedAttributes. If " + "signer.authenticatedAttributes is specified, then it must " + "contain at least two attributes, PKCS #9 content-type and " + "PKCS #9 message-digest.");
        }
      }
      msg.signers.push({
        key: key,
        version: 1,
        issuer: issuer,
        serialNumber: serialNumber,
        digestAlgorithm: digestAlgorithm,
        signatureAlgorithm: forge.pki.oids.rsaEncryption,
        signature: null,
        authenticatedAttributes: authenticatedAttributes,
        unauthenticatedAttributes: []
      });
    },
    sign: function () {
      if (typeof msg.content !== "object" || msg.contentInfo === null) {
        msg.contentInfo = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.data).getBytes())]);
        if (("content" in msg)) {
          var content;
          if (msg.content instanceof forge.util.ByteBuffer) {
            content = msg.content.bytes();
          } else if (typeof msg.content === "string") {
            content = forge.util.encodeUtf8(msg.content);
          }
          msg.contentInfo.value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, content)]));
        }
      }
      if (msg.signers.length === 0) {
        return;
      }
      var mds = addDigestAlgorithmIds();
      addSignerInfos(mds);
    },
    verify: function () {
      throw new Error("PKCS#7 signature verification not yet implemented.");
    },
    addCertificate: function (cert) {
      if (typeof cert === "string") {
        cert = forge.pki.certificateFromPem(cert);
      }
      msg.certificates.push(cert);
    },
    addCertificateRevokationList: function (crl) {
      throw new Error("PKCS#7 CRL support not yet implemented.");
    }
  };
  return msg;
  function addDigestAlgorithmIds() {
    var mds = {};
    for (var i = 0; i < msg.signers.length; ++i) {
      var signer = msg.signers[i];
      var oid = signer.digestAlgorithm;
      if (!((oid in mds))) {
        mds[oid] = forge.md[forge.pki.oids[oid]].create();
      }
      if (signer.authenticatedAttributes.length === 0) {
        signer.md = mds[oid];
      } else {
        signer.md = forge.md[forge.pki.oids[oid]].create();
      }
    }
    msg.digestAlgorithmIdentifiers = [];
    for (var oid in mds) {
      msg.digestAlgorithmIdentifiers.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oid).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]));
    }
    return mds;
  }
  function addSignerInfos(mds) {
    if (msg.contentInfo.value.length < 2) {
      throw new Error("Could not sign PKCS#7 message; there is no content to sign.");
    }
    var contentType = asn1.derToOid(msg.contentInfo.value[0].value);
    var content = msg.contentInfo.value[1];
    content = content.value[0];
    var bytes = asn1.toDer(content);
    bytes.getByte();
    asn1.getBerValueLength(bytes);
    bytes = bytes.getBytes();
    for (var oid in mds) {
      mds[oid].start().update(bytes);
    }
    var signingTime = new Date();
    for (var i = 0; i < msg.signers.length; ++i) {
      var signer = msg.signers[i];
      if (signer.authenticatedAttributes.length === 0) {
        if (contentType !== forge.pki.oids.data) {
          throw new Error("Invalid signer; authenticatedAttributes must be present " + "when the ContentInfo content type is not PKCS#7 Data.");
        }
      } else {
        signer.authenticatedAttributesAsn1 = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, []);
        var attrsAsn1 = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, []);
        for (var ai = 0; ai < signer.authenticatedAttributes.length; ++ai) {
          var attr = signer.authenticatedAttributes[ai];
          if (attr.type === forge.pki.oids.messageDigest) {
            attr.value = mds[signer.digestAlgorithm].digest();
          } else if (attr.type === forge.pki.oids.signingTime) {
            if (!attr.value) {
              attr.value = signingTime;
            }
          }
          attrsAsn1.value.push(_attributeToAsn1(attr));
          signer.authenticatedAttributesAsn1.value.push(_attributeToAsn1(attr));
        }
        bytes = asn1.toDer(attrsAsn1).getBytes();
        signer.md.start().update(bytes);
      }
      signer.signature = signer.key.sign(signer.md, "RSASSA-PKCS1-V1_5");
    }
    msg.signerInfos = _signersToAsn1(msg.signers);
  }
};
p7.createEncryptedData = function () {
  var msg = null;
  msg = {
    type: forge.pki.oids.encryptedData,
    version: 0,
    encryptedContent: {
      algorithm: forge.pki.oids["aes256-CBC"]
    },
    fromAsn1: function (obj) {
      _fromAsn1(msg, obj, p7.asn1.encryptedDataValidator);
    },
    decrypt: function (key) {
      if (key !== undefined) {
        msg.encryptedContent.key = key;
      }
      _decryptContent(msg);
    }
  };
  return msg;
};
p7.createEnvelopedData = function () {
  var msg = null;
  msg = {
    type: forge.pki.oids.envelopedData,
    version: 0,
    recipients: [],
    encryptedContent: {
      algorithm: forge.pki.oids["aes256-CBC"]
    },
    fromAsn1: function (obj) {
      var capture = _fromAsn1(msg, obj, p7.asn1.envelopedDataValidator);
      msg.recipients = _recipientsFromAsn1(capture.recipientInfos.value);
    },
    toAsn1: function () {
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(msg.type).getBytes()), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(msg.version).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, _recipientsToAsn1(msg.recipients)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, _encryptedContentToAsn1(msg.encryptedContent))])])]);
    },
    findRecipient: function (cert) {
      var sAttr = cert.issuer.attributes;
      for (var i = 0; i < msg.recipients.length; ++i) {
        var r = msg.recipients[i];
        var rAttr = r.issuer;
        if (r.serialNumber !== cert.serialNumber) {
          continue;
        }
        if (rAttr.length !== sAttr.length) {
          continue;
        }
        var match = true;
        for (var j = 0; j < sAttr.length; ++j) {
          if (rAttr[j].type !== sAttr[j].type || rAttr[j].value !== sAttr[j].value) {
            match = false;
            break;
          }
        }
        if (match) {
          return r;
        }
      }
      return null;
    },
    decrypt: function (recipient, privKey) {
      if (msg.encryptedContent.key === undefined && recipient !== undefined && privKey !== undefined) {
        switch (recipient.encryptedContent.algorithm) {
          case forge.pki.oids.rsaEncryption:
          case forge.pki.oids.desCBC:
            var key = privKey.decrypt(recipient.encryptedContent.content);
            msg.encryptedContent.key = forge.util.createBuffer(key);
            break;
          default:
            throw new Error("Unsupported asymmetric cipher, " + "OID " + recipient.encryptedContent.algorithm);
        }
      }
      _decryptContent(msg);
    },
    addRecipient: function (cert) {
      msg.recipients.push({
        version: 0,
        issuer: cert.issuer.attributes,
        serialNumber: cert.serialNumber,
        encryptedContent: {
          algorithm: forge.pki.oids.rsaEncryption,
          key: cert.publicKey
        }
      });
    },
    encrypt: function (key, cipher) {
      if (msg.encryptedContent.content === undefined) {
        cipher = cipher || msg.encryptedContent.algorithm;
        key = key || msg.encryptedContent.key;
        var keyLen, ivLen, ciphFn;
        switch (cipher) {
          case forge.pki.oids["aes128-CBC"]:
            keyLen = 16;
            ivLen = 16;
            ciphFn = forge.aes.createEncryptionCipher;
            break;
          case forge.pki.oids["aes192-CBC"]:
            keyLen = 24;
            ivLen = 16;
            ciphFn = forge.aes.createEncryptionCipher;
            break;
          case forge.pki.oids["aes256-CBC"]:
            keyLen = 32;
            ivLen = 16;
            ciphFn = forge.aes.createEncryptionCipher;
            break;
          case forge.pki.oids["des-EDE3-CBC"]:
            keyLen = 24;
            ivLen = 8;
            ciphFn = forge.des.createEncryptionCipher;
            break;
          default:
            throw new Error("Unsupported symmetric cipher, OID " + cipher);
        }
        if (key === undefined) {
          key = forge.util.createBuffer(forge.random.getBytes(keyLen));
        } else if (key.length() != keyLen) {
          throw new Error("Symmetric key has wrong length; " + "got " + key.length() + " bytes, expected " + keyLen + ".");
        }
        msg.encryptedContent.algorithm = cipher;
        msg.encryptedContent.key = key;
        msg.encryptedContent.parameter = forge.util.createBuffer(forge.random.getBytes(ivLen));
        var ciph = ciphFn(key);
        ciph.start(msg.encryptedContent.parameter.copy());
        ciph.update(msg.content);
        if (!ciph.finish()) {
          throw new Error("Symmetric encryption failed.");
        }
        msg.encryptedContent.content = ciph.output;
      }
      for (var i = 0; i < msg.recipients.length; ++i) {
        var recipient = msg.recipients[i];
        if (recipient.encryptedContent.content !== undefined) {
          continue;
        }
        switch (recipient.encryptedContent.algorithm) {
          case forge.pki.oids.rsaEncryption:
            recipient.encryptedContent.content = recipient.encryptedContent.key.encrypt(msg.encryptedContent.key.data);
            break;
          default:
            throw new Error("Unsupported asymmetric cipher, OID " + recipient.encryptedContent.algorithm);
        }
      }
    }
  };
  return msg;
};
function _recipientFromAsn1(obj) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, p7.asn1.recipientInfoValidator, capture, errors)) {
    var error = new Error("Cannot read PKCS#7 RecipientInfo. " + "ASN.1 object is not an PKCS#7 RecipientInfo.");
    error.errors = errors;
    throw error;
  }
  return {
    version: capture.version.charCodeAt(0),
    issuer: forge.pki.RDNAttributesAsArray(capture.issuer),
    serialNumber: forge.util.createBuffer(capture.serial).toHex(),
    encryptedContent: {
      algorithm: asn1.derToOid(capture.encAlgorithm),
      parameter: capture.encParameter.value,
      content: capture.encKey
    }
  };
}
function _recipientToAsn1(obj) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(obj.version).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [forge.pki.distinguishedNameToAsn1({
    attributes: obj.issuer
  }), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, forge.util.hexToBytes(obj.serialNumber))]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(obj.encryptedContent.algorithm).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, obj.encryptedContent.content)]);
}
function _recipientsFromAsn1(infos) {
  var ret = [];
  for (var i = 0; i < infos.length; ++i) {
    ret.push(_recipientFromAsn1(infos[i]));
  }
  return ret;
}
function _recipientsToAsn1(recipients) {
  var ret = [];
  for (var i = 0; i < recipients.length; ++i) {
    ret.push(_recipientToAsn1(recipients[i]));
  }
  return ret;
}
function _signerToAsn1(obj) {
  var rval = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(obj.version).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [forge.pki.distinguishedNameToAsn1({
    attributes: obj.issuer
  }), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, forge.util.hexToBytes(obj.serialNumber))]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(obj.digestAlgorithm).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")])]);
  if (obj.authenticatedAttributesAsn1) {
    rval.value.push(obj.authenticatedAttributesAsn1);
  }
  rval.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(obj.signatureAlgorithm).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")]));
  rval.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, obj.signature));
  if (obj.unauthenticatedAttributes.length > 0) {
    var attrsAsn1 = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, []);
    for (var i = 0; i < obj.unauthenticatedAttributes.length; ++i) {
      var attr = obj.unauthenticatedAttributes[i];
      attrsAsn1.values.push(_attributeToAsn1(attr));
    }
    rval.value.push(attrsAsn1);
  }
  return rval;
}
function _signersToAsn1(signers) {
  var ret = [];
  for (var i = 0; i < signers.length; ++i) {
    ret.push(_signerToAsn1(signers[i]));
  }
  return ret;
}
function _attributeToAsn1(attr) {
  var value;
  if (attr.type === forge.pki.oids.contentType) {
    value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(attr.value).getBytes());
  } else if (attr.type === forge.pki.oids.messageDigest) {
    value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, attr.value.bytes());
  } else if (attr.type === forge.pki.oids.signingTime) {
    var jan_1_1950 = new Date("1950-01-01T00:00:00Z");
    var jan_1_2050 = new Date("2050-01-01T00:00:00Z");
    var date = attr.value;
    if (typeof date === "string") {
      var timestamp = Date.parse(date);
      if (!isNaN(timestamp)) {
        date = new Date(timestamp);
      } else if (date.length === 13) {
        date = asn1.utcTimeToDate(date);
      } else {
        date = asn1.generalizedTimeToDate(date);
      }
    }
    if (date >= jan_1_1950 && date < jan_1_2050) {
      value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.UTCTIME, false, asn1.dateToUtcTime(date));
    } else {
      value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.GENERALIZEDTIME, false, asn1.dateToGeneralizedTime(date));
    }
  }
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(attr.type).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [value])]);
}
function _encryptedContentToAsn1(ec) {
  return [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.data).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(ec.algorithm).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, ec.parameter.getBytes())]), asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, ec.content.getBytes())])];
}
function _fromAsn1(msg, obj, validator) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, validator, capture, errors)) {
    var error = new Error("Cannot read PKCS#7 message. " + "ASN.1 object is not a supported PKCS#7 message.");
    error.errors = error;
    throw error;
  }
  var contentType = asn1.derToOid(capture.contentType);
  if (contentType !== forge.pki.oids.data) {
    throw new Error("Unsupported PKCS#7 message. " + "Only wrapped ContentType Data supported.");
  }
  if (capture.encryptedContent) {
    var content = "";
    if (forge.util.isArray(capture.encryptedContent)) {
      for (var i = 0; i < capture.encryptedContent.length; ++i) {
        if (capture.encryptedContent[i].type !== asn1.Type.OCTETSTRING) {
          throw new Error("Malformed PKCS#7 message, expecting encrypted " + "content constructed of only OCTET STRING objects.");
        }
        content += capture.encryptedContent[i].value;
      }
    } else {
      content = capture.encryptedContent;
    }
    msg.encryptedContent = {
      algorithm: asn1.derToOid(capture.encAlgorithm),
      parameter: forge.util.createBuffer(capture.encParameter.value),
      content: forge.util.createBuffer(content)
    };
  }
  if (capture.content) {
    var content = "";
    if (forge.util.isArray(capture.content)) {
      for (var i = 0; i < capture.content.length; ++i) {
        if (capture.content[i].type !== asn1.Type.OCTETSTRING) {
          throw new Error("Malformed PKCS#7 message, expecting " + "content constructed of only OCTET STRING objects.");
        }
        content += capture.content[i].value;
      }
    } else {
      content = capture.content;
    }
    msg.content = forge.util.createBuffer(content);
  }
  msg.version = capture.version.charCodeAt(0);
  msg.rawCapture = capture;
  return capture;
}
function _decryptContent(msg) {
  if (msg.encryptedContent.key === undefined) {
    throw new Error("Symmetric key not available.");
  }
  if (msg.content === undefined) {
    var ciph;
    switch (msg.encryptedContent.algorithm) {
      case forge.pki.oids["aes128-CBC"]:
      case forge.pki.oids["aes192-CBC"]:
      case forge.pki.oids["aes256-CBC"]:
        ciph = forge.aes.createDecryptionCipher(msg.encryptedContent.key);
        break;
      case forge.pki.oids["desCBC"]:
      case forge.pki.oids["des-EDE3-CBC"]:
        ciph = forge.des.createDecryptionCipher(msg.encryptedContent.key);
        break;
      default:
        throw new Error("Unsupported symmetric cipher, OID " + msg.encryptedContent.algorithm);
    }
    ciph.start(msg.encryptedContent.parameter);
    ciph.update(msg.encryptedContent.content);
    if (!ciph.finish()) {
      throw new Error("Symmetric decryption failed.");
    }
    msg.content = ciph.output;
  }
}

export { forge as default };
