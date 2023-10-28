import 'module';
import './asn1.js';
import './util.js';

var forge = global.forge;
var asn1 = forge.asn1;
var p7v = forge.pkcs7asn1 = forge.pkcs7asn1 || ({});
forge.pkcs7 = forge.pkcs7 || ({});
forge.pkcs7.asn1 = p7v;
var contentInfoValidator = {
  name: "ContentInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "ContentInfo.ContentType",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OID,
    constructed: false,
    capture: "contentType"
  }, {
    name: "ContentInfo.content",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    optional: true,
    captureAsn1: "content"
  }]
};
p7v.contentInfoValidator = contentInfoValidator;
var encryptedContentInfoValidator = {
  name: "EncryptedContentInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "EncryptedContentInfo.contentType",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OID,
    constructed: false,
    capture: "contentType"
  }, {
    name: "EncryptedContentInfo.contentEncryptionAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "EncryptedContentInfo.contentEncryptionAlgorithm.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "encAlgorithm"
    }, {
      name: "EncryptedContentInfo.contentEncryptionAlgorithm.parameter",
      tagClass: asn1.Class.UNIVERSAL,
      captureAsn1: "encParameter"
    }]
  }, {
    name: "EncryptedContentInfo.encryptedContent",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 0,
    capture: "encryptedContent",
    captureAsn1: "encryptedContentAsn1"
  }]
};
p7v.envelopedDataValidator = {
  name: "EnvelopedData",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "EnvelopedData.Version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "version"
  }, {
    name: "EnvelopedData.RecipientInfos",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SET,
    constructed: true,
    captureAsn1: "recipientInfos"
  }].concat(encryptedContentInfoValidator)
};
p7v.encryptedDataValidator = {
  name: "EncryptedData",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "EncryptedData.Version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "version"
  }].concat(encryptedContentInfoValidator)
};
var signerValidator = {
  name: "SignerInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "SignerInfo.version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false
  }, {
    name: "SignerInfo.issuerAndSerialNumber",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "SignerInfo.issuerAndSerialNumber.issuer",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "issuer"
    }, {
      name: "SignerInfo.issuerAndSerialNumber.serialNumber",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.INTEGER,
      constructed: false,
      capture: "serial"
    }]
  }, {
    name: "SignerInfo.digestAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "SignerInfo.digestAlgorithm.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "digestAlgorithm"
    }, {
      name: "SignerInfo.digestAlgorithm.parameter",
      tagClass: asn1.Class.UNIVERSAL,
      constructed: false,
      captureAsn1: "digestParameter",
      optional: true
    }]
  }, {
    name: "SignerInfo.authenticatedAttributes",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    optional: true,
    capture: "authenticatedAttributes"
  }, {
    name: "SignerInfo.digestEncryptionAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    capture: "signatureAlgorithm"
  }, {
    name: "SignerInfo.encryptedDigest",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OCTETSTRING,
    constructed: false,
    capture: "signature"
  }, {
    name: "SignerInfo.unauthenticatedAttributes",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 1,
    constructed: true,
    optional: true,
    capture: "unauthenticatedAttributes"
  }]
};
p7v.signedDataValidator = {
  name: "SignedData",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "SignedData.Version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "version"
  }, {
    name: "SignedData.DigestAlgorithms",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SET,
    constructed: true,
    captureAsn1: "digestAlgorithms"
  }, contentInfoValidator, {
    name: "SignedData.Certificates",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 0,
    optional: true,
    captureAsn1: "certificates"
  }, {
    name: "SignedData.CertificateRevocationLists",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 1,
    optional: true,
    captureAsn1: "crls"
  }, {
    name: "SignedData.SignerInfos",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SET,
    capture: "signerInfos",
    optional: true,
    value: [signerValidator]
  }]
};
p7v.recipientInfoValidator = {
  name: "RecipientInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "RecipientInfo.version",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "version"
  }, {
    name: "RecipientInfo.issuerAndSerial",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "RecipientInfo.issuerAndSerial.issuer",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "issuer"
    }, {
      name: "RecipientInfo.issuerAndSerial.serialNumber",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.INTEGER,
      constructed: false,
      capture: "serial"
    }]
  }, {
    name: "RecipientInfo.keyEncryptionAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "RecipientInfo.keyEncryptionAlgorithm.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "encAlgorithm"
    }, {
      name: "RecipientInfo.keyEncryptionAlgorithm.parameter",
      tagClass: asn1.Class.UNIVERSAL,
      constructed: false,
      captureAsn1: "encParameter"
    }]
  }, {
    name: "RecipientInfo.encryptedKey",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.OCTETSTRING,
    constructed: false,
    capture: "encKey"
  }]
};

export { forge as default };
