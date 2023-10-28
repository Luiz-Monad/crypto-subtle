import 'module';
import './aes.js';
import './asn1.js';
import './des.js';
import './md.js';
import './mgf.js';
import './oids.js';
import './pem.js';
import './pss.js';
import './rsa.js';
import './util.js';

var forge = global.forge;
var asn1 = forge.asn1;
var pki = forge.pki = forge.pki || ({});
var oids = pki.oids;
var _shortNames = {};
_shortNames["CN"] = oids["commonName"];
_shortNames["commonName"] = "CN";
_shortNames["C"] = oids["countryName"];
_shortNames["countryName"] = "C";
_shortNames["L"] = oids["localityName"];
_shortNames["localityName"] = "L";
_shortNames["ST"] = oids["stateOrProvinceName"];
_shortNames["stateOrProvinceName"] = "ST";
_shortNames["O"] = oids["organizationName"];
_shortNames["organizationName"] = "O";
_shortNames["OU"] = oids["organizationalUnitName"];
_shortNames["organizationalUnitName"] = "OU";
_shortNames["E"] = oids["emailAddress"];
_shortNames["emailAddress"] = "E";
var publicKeyValidator = forge.pki.rsa.publicKeyValidator;
var x509CertificateValidator = {
  name: "Certificate",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "Certificate.TBSCertificate",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    captureAsn1: "tbsCertificate",
    value: [{
      name: "Certificate.TBSCertificate.version",
      tagClass: asn1.Class.CONTEXT_SPECIFIC,
      type: 0,
      constructed: true,
      optional: true,
      value: [{
        name: "Certificate.TBSCertificate.version.integer",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "certVersion"
      }]
    }, {
      name: "Certificate.TBSCertificate.serialNumber",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.INTEGER,
      constructed: false,
      capture: "certSerialNumber"
    }, {
      name: "Certificate.TBSCertificate.signature",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "Certificate.TBSCertificate.signature.algorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "certinfoSignatureOid"
      }, {
        name: "Certificate.TBSCertificate.signature.parameters",
        tagClass: asn1.Class.UNIVERSAL,
        optional: true,
        captureAsn1: "certinfoSignatureParams"
      }]
    }, {
      name: "Certificate.TBSCertificate.issuer",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "certIssuer"
    }, {
      name: "Certificate.TBSCertificate.validity",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "Certificate.TBSCertificate.validity.notBefore (utc)",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.UTCTIME,
        constructed: false,
        optional: true,
        capture: "certValidity1UTCTime"
      }, {
        name: "Certificate.TBSCertificate.validity.notBefore (generalized)",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.GENERALIZEDTIME,
        constructed: false,
        optional: true,
        capture: "certValidity2GeneralizedTime"
      }, {
        name: "Certificate.TBSCertificate.validity.notAfter (utc)",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.UTCTIME,
        constructed: false,
        optional: true,
        capture: "certValidity3UTCTime"
      }, {
        name: "Certificate.TBSCertificate.validity.notAfter (generalized)",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.GENERALIZEDTIME,
        constructed: false,
        optional: true,
        capture: "certValidity4GeneralizedTime"
      }]
    }, {
      name: "Certificate.TBSCertificate.subject",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "certSubject"
    }, publicKeyValidator, {
      name: "Certificate.TBSCertificate.issuerUniqueID",
      tagClass: asn1.Class.CONTEXT_SPECIFIC,
      type: 1,
      constructed: true,
      optional: true,
      value: [{
        name: "Certificate.TBSCertificate.issuerUniqueID.id",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.BITSTRING,
        constructed: false,
        captureBitStringValue: "certIssuerUniqueId"
      }]
    }, {
      name: "Certificate.TBSCertificate.subjectUniqueID",
      tagClass: asn1.Class.CONTEXT_SPECIFIC,
      type: 2,
      constructed: true,
      optional: true,
      value: [{
        name: "Certificate.TBSCertificate.subjectUniqueID.id",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.BITSTRING,
        constructed: false,
        captureBitStringValue: "certSubjectUniqueId"
      }]
    }, {
      name: "Certificate.TBSCertificate.extensions",
      tagClass: asn1.Class.CONTEXT_SPECIFIC,
      type: 3,
      constructed: true,
      captureAsn1: "certExtensions",
      optional: true
    }]
  }, {
    name: "Certificate.signatureAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "Certificate.signatureAlgorithm.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "certSignatureOid"
    }, {
      name: "Certificate.TBSCertificate.signature.parameters",
      tagClass: asn1.Class.UNIVERSAL,
      optional: true,
      captureAsn1: "certSignatureParams"
    }]
  }, {
    name: "Certificate.signatureValue",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.BITSTRING,
    constructed: false,
    captureBitStringValue: "certSignature"
  }]
};
var rsassaPssParameterValidator = {
  name: "rsapss",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: "rsapss.hashAlgorithm",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    value: [{
      name: "rsapss.hashAlgorithm.AlgorithmIdentifier",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Class.SEQUENCE,
      constructed: true,
      optional: true,
      value: [{
        name: "rsapss.hashAlgorithm.AlgorithmIdentifier.algorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "hashOid"
      }]
    }]
  }, {
    name: "rsapss.maskGenAlgorithm",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 1,
    constructed: true,
    value: [{
      name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Class.SEQUENCE,
      constructed: true,
      optional: true,
      value: [{
        name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.algorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "maskGenOid"
      }, {
        name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.params",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.params.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "maskGenHashOid"
        }]
      }]
    }]
  }, {
    name: "rsapss.saltLength",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 2,
    optional: true,
    value: [{
      name: "rsapss.saltLength.saltLength",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Class.INTEGER,
      constructed: false,
      capture: "saltLength"
    }]
  }, {
    name: "rsapss.trailerField",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 3,
    optional: true,
    value: [{
      name: "rsapss.trailer.trailer",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Class.INTEGER,
      constructed: false,
      capture: "trailer"
    }]
  }]
};
var certificationRequestInfoValidator = {
  name: "CertificationRequestInfo",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  captureAsn1: "certificationRequestInfo",
  value: [{
    name: "CertificationRequestInfo.integer",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.INTEGER,
    constructed: false,
    capture: "certificationRequestInfoVersion"
  }, {
    name: "CertificationRequestInfo.subject",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    captureAsn1: "certificationRequestInfoSubject"
  }, publicKeyValidator, {
    name: "CertificationRequestInfo.attributes",
    tagClass: asn1.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    optional: true,
    capture: "certificationRequestInfoAttributes",
    value: [{
      name: "CertificationRequestInfo.attributes",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "CertificationRequestInfo.attributes.type",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false
      }, {
        name: "CertificationRequestInfo.attributes.value",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SET,
        constructed: true
      }]
    }]
  }]
};
var certificationRequestValidator = {
  name: "CertificationRequest",
  tagClass: asn1.Class.UNIVERSAL,
  type: asn1.Type.SEQUENCE,
  constructed: true,
  captureAsn1: "csr",
  value: [certificationRequestInfoValidator, {
    name: "CertificationRequest.signatureAlgorithm",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: "CertificationRequest.signatureAlgorithm.algorithm",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.OID,
      constructed: false,
      capture: "csrSignatureOid"
    }, {
      name: "CertificationRequest.signatureAlgorithm.parameters",
      tagClass: asn1.Class.UNIVERSAL,
      optional: true,
      captureAsn1: "csrSignatureParams"
    }]
  }, {
    name: "CertificationRequest.signature",
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.BITSTRING,
    constructed: false,
    captureBitStringValue: "csrSignature"
  }]
};
pki.RDNAttributesAsArray = function (rdn, md) {
  var rval = [];
  var set, attr, obj;
  for (var si = 0; si < rdn.value.length; ++si) {
    set = rdn.value[si];
    for (var i = 0; i < set.value.length; ++i) {
      obj = {};
      attr = set.value[i];
      obj.type = asn1.derToOid(attr.value[0].value);
      obj.value = attr.value[1].value;
      obj.valueTagClass = attr.value[1].type;
      if ((obj.type in oids)) {
        obj.name = oids[obj.type];
        if ((obj.name in _shortNames)) {
          obj.shortName = _shortNames[obj.name];
        }
      }
      if (md) {
        md.update(obj.type);
        md.update(obj.value);
      }
      rval.push(obj);
    }
  }
  return rval;
};
pki.CRIAttributesAsArray = function (attributes) {
  var rval = [];
  for (var si = 0; si < attributes.length; ++si) {
    var seq = attributes[si];
    var type = asn1.derToOid(seq.value[0].value);
    var values = seq.value[1].value;
    for (var vi = 0; vi < values.length; ++vi) {
      var obj = {};
      obj.type = type;
      obj.value = values[vi].value;
      obj.valueTagClass = values[vi].type;
      if ((obj.type in oids)) {
        obj.name = oids[obj.type];
        if ((obj.name in _shortNames)) {
          obj.shortName = _shortNames[obj.name];
        }
      }
      if (obj.type === oids.extensionRequest) {
        obj.extensions = [];
        for (var ei = 0; ei < obj.value.length; ++ei) {
          obj.extensions.push(pki.certificateExtensionFromAsn1(obj.value[ei]));
        }
      }
      rval.push(obj);
    }
  }
  return rval;
};
function _getAttribute(obj, options) {
  if (typeof options === "string") {
    options = {
      shortName: options
    };
  }
  var rval = null;
  var attr;
  for (var i = 0; rval === null && i < obj.attributes.length; ++i) {
    attr = obj.attributes[i];
    if (options.type && options.type === attr.type) {
      rval = attr;
    } else if (options.name && options.name === attr.name) {
      rval = attr;
    } else if (options.shortName && options.shortName === attr.shortName) {
      rval = attr;
    }
  }
  return rval;
}
var _readSignatureParameters = function (oid, obj, fillDefaults) {
  var params = {};
  if (oid !== oids["RSASSA-PSS"]) {
    return params;
  }
  if (fillDefaults) {
    params = {
      hash: {
        algorithmOid: oids["sha1"]
      },
      mgf: {
        algorithmOid: oids["mgf1"],
        hash: {
          algorithmOid: oids["sha1"]
        }
      },
      saltLength: 20
    };
  }
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, rsassaPssParameterValidator, capture, errors)) {
    var error = new Error("Cannot read RSASSA-PSS parameter block.");
    error.errors = errors;
    throw error;
  }
  if (capture.hashOid !== undefined) {
    params.hash = params.hash || ({});
    params.hash.algorithmOid = asn1.derToOid(capture.hashOid);
  }
  if (capture.maskGenOid !== undefined) {
    params.mgf = params.mgf || ({});
    params.mgf.algorithmOid = asn1.derToOid(capture.maskGenOid);
    params.mgf.hash = params.mgf.hash || ({});
    params.mgf.hash.algorithmOid = asn1.derToOid(capture.maskGenHashOid);
  }
  if (capture.saltLength !== undefined) {
    params.saltLength = capture.saltLength.charCodeAt(0);
  }
  return params;
};
pki.certificateFromPem = function (pem, computeHash, strict) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "CERTIFICATE" && msg.type !== "X509 CERTIFICATE" && msg.type !== "TRUSTED CERTIFICATE") {
    var error = new Error("Could not convert certificate from PEM; PEM header type " + "is not \"CERTIFICATE\", \"X509 CERTIFICATE\", or \"TRUSTED CERTIFICATE\".");
    error.headerType = msg.type;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert certificate from PEM; PEM is encrypted.");
  }
  var obj = asn1.fromDer(msg.body, strict);
  return pki.certificateFromAsn1(obj, computeHash);
};
pki.certificateToPem = function (cert, maxline) {
  var msg = {
    type: "CERTIFICATE",
    body: asn1.toDer(pki.certificateToAsn1(cert)).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};
pki.publicKeyFromPem = function (pem) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "PUBLIC KEY" && msg.type !== "RSA PUBLIC KEY") {
    var error = new Error("Could not convert public key from PEM; PEM header " + "type is not \"PUBLIC KEY\" or \"RSA PUBLIC KEY\".");
    error.headerType = msg.type;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert public key from PEM; PEM is encrypted.");
  }
  var obj = asn1.fromDer(msg.body);
  return pki.publicKeyFromAsn1(obj);
};
pki.publicKeyToPem = function (key, maxline) {
  var msg = {
    type: "PUBLIC KEY",
    body: asn1.toDer(pki.publicKeyToAsn1(key)).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};
pki.publicKeyToRSAPublicKeyPem = function (key, maxline) {
  var msg = {
    type: "RSA PUBLIC KEY",
    body: asn1.toDer(pki.publicKeyToRSAPublicKey(key)).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};
pki.getPublicKeyFingerprint = function (key, options) {
  options = options || ({});
  var md = options.md || forge.md.sha1.create();
  var type = options.type || "RSAPublicKey";
  var bytes;
  switch (type) {
    case "RSAPublicKey":
      bytes = asn1.toDer(pki.publicKeyToRSAPublicKey(key)).getBytes();
      break;
    case "SubjectPublicKeyInfo":
      bytes = asn1.toDer(pki.publicKeyToAsn1(key)).getBytes();
      break;
    default:
      throw new Error("Unknown fingerprint type \"" + options.type + "\".");
  }
  md.start();
  md.update(bytes);
  var digest = md.digest();
  if (options.encoding === "hex") {
    var hex = digest.toHex();
    if (options.delimiter) {
      return hex.match(/.{2}/g).join(options.delimiter);
    }
    return hex;
  } else if (options.encoding === "binary") {
    return digest.getBytes();
  } else if (options.encoding) {
    throw new Error("Unknown encoding \"" + options.encoding + "\".");
  }
  return digest;
};
pki.certificationRequestFromPem = function (pem, computeHash, strict) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "CERTIFICATE REQUEST") {
    var error = new Error("Could not convert certification request from PEM; " + "PEM header type is not \"CERTIFICATE REQUEST\".");
    error.headerType = msg.type;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert certification request from PEM; " + "PEM is encrypted.");
  }
  var obj = asn1.fromDer(msg.body, strict);
  return pki.certificationRequestFromAsn1(obj, computeHash);
};
pki.certificationRequestToPem = function (csr, maxline) {
  var msg = {
    type: "CERTIFICATE REQUEST",
    body: asn1.toDer(pki.certificationRequestToAsn1(csr)).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};
pki.createCertificate = function () {
  var cert = {};
  cert.version = 2;
  cert.serialNumber = "00";
  cert.signatureOid = null;
  cert.signature = null;
  cert.siginfo = {};
  cert.siginfo.algorithmOid = null;
  cert.validity = {};
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.issuer = {};
  cert.issuer.getField = function (sn) {
    return _getAttribute(cert.issuer, sn);
  };
  cert.issuer.addField = function (attr) {
    _fillMissingFields([attr]);
    cert.issuer.attributes.push(attr);
  };
  cert.issuer.attributes = [];
  cert.issuer.hash = null;
  cert.subject = {};
  cert.subject.getField = function (sn) {
    return _getAttribute(cert.subject, sn);
  };
  cert.subject.addField = function (attr) {
    _fillMissingFields([attr]);
    cert.subject.attributes.push(attr);
  };
  cert.subject.attributes = [];
  cert.subject.hash = null;
  cert.extensions = [];
  cert.publicKey = null;
  cert.md = null;
  cert.setSubject = function (attrs, uniqueId) {
    _fillMissingFields(attrs);
    cert.subject.attributes = attrs;
    delete cert.subject.uniqueId;
    if (uniqueId) {
      cert.subject.uniqueId = uniqueId;
    }
    cert.subject.hash = null;
  };
  cert.setIssuer = function (attrs, uniqueId) {
    _fillMissingFields(attrs);
    cert.issuer.attributes = attrs;
    delete cert.issuer.uniqueId;
    if (uniqueId) {
      cert.issuer.uniqueId = uniqueId;
    }
    cert.issuer.hash = null;
  };
  cert.setExtensions = function (exts) {
    for (var i = 0; i < exts.length; ++i) {
      _fillMissingExtensionFields(exts[i], {
        cert: cert
      });
    }
    cert.extensions = exts;
  };
  cert.getExtension = function (options) {
    if (typeof options === "string") {
      options = {
        name: options
      };
    }
    var rval = null;
    var ext;
    for (var i = 0; rval === null && i < cert.extensions.length; ++i) {
      ext = cert.extensions[i];
      if (options.id && ext.id === options.id) {
        rval = ext;
      } else if (options.name && ext.name === options.name) {
        rval = ext;
      }
    }
    return rval;
  };
  cert.sign = function (key, md) {
    cert.md = md || forge.md.sha1.create();
    var algorithmOid = oids[cert.md.algorithm + "WithRSAEncryption"];
    if (!algorithmOid) {
      var error = new Error("Could not compute certificate digest. " + "Unknown message digest algorithm OID.");
      error.algorithm = cert.md.algorithm;
      throw error;
    }
    cert.signatureOid = cert.siginfo.algorithmOid = algorithmOid;
    cert.tbsCertificate = pki.getTBSCertificate(cert);
    var bytes = asn1.toDer(cert.tbsCertificate);
    cert.md.update(bytes.getBytes());
    cert.signature = key.sign(cert.md);
  };
  cert.verify = function (child) {
    var rval = false;
    if (!cert.issued(child)) {
      var issuer = child.issuer;
      var subject = cert.subject;
      var error = new Error("The parent certificate did not issue the given child " + "certificate; the child certificate's issuer does not match the " + "parent's subject.");
      error.expectedIssuer = issuer.attributes;
      error.actualIssuer = subject.attributes;
      throw error;
    }
    var md = child.md;
    if (md === null) {
      if ((child.signatureOid in oids)) {
        var oid = oids[child.signatureOid];
        switch (oid) {
          case "sha1WithRSAEncryption":
            md = forge.md.sha1.create();
            break;
          case "md5WithRSAEncryption":
            md = forge.md.md5.create();
            break;
          case "sha256WithRSAEncryption":
            md = forge.md.sha256.create();
            break;
          case "sha512WithRSAEncryption":
            md = forge.md.sha512.create();
            break;
          case "RSASSA-PSS":
            md = forge.md.sha256.create();
            break;
        }
      }
      if (md === null) {
        var error = new Error("Could not compute certificate digest. " + "Unknown signature OID.");
        error.signatureOid = child.signatureOid;
        throw error;
      }
      var tbsCertificate = child.tbsCertificate || pki.getTBSCertificate(child);
      var bytes = asn1.toDer(tbsCertificate);
      md.update(bytes.getBytes());
    }
    if (md !== null) {
      var scheme;
      switch (child.signatureOid) {
        case oids.sha1WithRSAEncryption:
          scheme = undefined;
          break;
        case oids["RSASSA-PSS"]:
          var hash, mgf;
          hash = oids[child.signatureParameters.mgf.hash.algorithmOid];
          if (hash === undefined || forge.md[hash] === undefined) {
            var error = new Error("Unsupported MGF hash function.");
            error.oid = child.signatureParameters.mgf.hash.algorithmOid;
            error.name = hash;
            throw error;
          }
          mgf = oids[child.signatureParameters.mgf.algorithmOid];
          if (mgf === undefined || forge.mgf[mgf] === undefined) {
            var error = new Error("Unsupported MGF function.");
            error.oid = child.signatureParameters.mgf.algorithmOid;
            error.name = mgf;
            throw error;
          }
          mgf = forge.mgf[mgf].create(forge.md[hash].create());
          hash = oids[child.signatureParameters.hash.algorithmOid];
          if (hash === undefined || forge.md[hash] === undefined) {
            throw {
              message: "Unsupported RSASSA-PSS hash function.",
              oid: child.signatureParameters.hash.algorithmOid,
              name: hash
            };
          }
          scheme = forge.pss.create(forge.md[hash].create(), mgf, child.signatureParameters.saltLength);
          break;
      }
      rval = cert.publicKey.verify(md.digest().getBytes(), child.signature, scheme);
    }
    return rval;
  };
  cert.isIssuer = function (parent) {
    var rval = false;
    var i = cert.issuer;
    var s = parent.subject;
    if (i.hash && s.hash) {
      rval = i.hash === s.hash;
    } else if (i.attributes.length === s.attributes.length) {
      rval = true;
      var iattr, sattr;
      for (var n = 0; rval && n < i.attributes.length; ++n) {
        iattr = i.attributes[n];
        sattr = s.attributes[n];
        if (iattr.type !== sattr.type || iattr.value !== sattr.value) {
          rval = false;
        }
      }
    }
    return rval;
  };
  cert.issued = function (child) {
    return child.isIssuer(cert);
  };
  cert.generateSubjectKeyIdentifier = function () {
    return pki.getPublicKeyFingerprint(cert.publicKey, {
      type: "RSAPublicKey"
    });
  };
  cert.verifySubjectKeyIdentifier = function () {
    var oid = oids["subjectKeyIdentifier"];
    for (var i = 0; i < cert.extensions.length; ++i) {
      var ext = cert.extensions[i];
      if (ext.id === oid) {
        var ski = cert.generateSubjectKeyIdentifier().getBytes();
        return forge.util.hexToBytes(ext.subjectKeyIdentifier) === ski;
      }
    }
    return false;
  };
  return cert;
};
pki.certificateFromAsn1 = function (obj, computeHash) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, x509CertificateValidator, capture, errors)) {
    var error = new Error("Cannot read X.509 certificate. " + "ASN.1 object is not an X509v3 Certificate.");
    error.errors = errors;
    throw error;
  }
  var oid = asn1.derToOid(capture.publicKeyOid);
  if (oid !== pki.oids.rsaEncryption) {
    throw new Error("Cannot read public key. OID is not RSA.");
  }
  var cert = pki.createCertificate();
  cert.version = capture.certVersion ? capture.certVersion.charCodeAt(0) : 0;
  var serial = forge.util.createBuffer(capture.certSerialNumber);
  cert.serialNumber = serial.toHex();
  cert.signatureOid = forge.asn1.derToOid(capture.certSignatureOid);
  cert.signatureParameters = _readSignatureParameters(cert.signatureOid, capture.certSignatureParams, true);
  cert.siginfo.algorithmOid = forge.asn1.derToOid(capture.certinfoSignatureOid);
  cert.siginfo.parameters = _readSignatureParameters(cert.siginfo.algorithmOid, capture.certinfoSignatureParams, false);
  cert.signature = capture.certSignature;
  var validity = [];
  if (capture.certValidity1UTCTime !== undefined) {
    validity.push(asn1.utcTimeToDate(capture.certValidity1UTCTime));
  }
  if (capture.certValidity2GeneralizedTime !== undefined) {
    validity.push(asn1.generalizedTimeToDate(capture.certValidity2GeneralizedTime));
  }
  if (capture.certValidity3UTCTime !== undefined) {
    validity.push(asn1.utcTimeToDate(capture.certValidity3UTCTime));
  }
  if (capture.certValidity4GeneralizedTime !== undefined) {
    validity.push(asn1.generalizedTimeToDate(capture.certValidity4GeneralizedTime));
  }
  if (validity.length > 2) {
    throw new Error("Cannot read notBefore/notAfter validity times; more " + "than two times were provided in the certificate.");
  }
  if (validity.length < 2) {
    throw new Error("Cannot read notBefore/notAfter validity times; they " + "were not provided as either UTCTime or GeneralizedTime.");
  }
  cert.validity.notBefore = validity[0];
  cert.validity.notAfter = validity[1];
  cert.tbsCertificate = capture.tbsCertificate;
  if (computeHash) {
    cert.md = null;
    if ((cert.signatureOid in oids)) {
      var oid = oids[cert.signatureOid];
      switch (oid) {
        case "sha1WithRSAEncryption":
          cert.md = forge.md.sha1.create();
          break;
        case "md5WithRSAEncryption":
          cert.md = forge.md.md5.create();
          break;
        case "sha256WithRSAEncryption":
          cert.md = forge.md.sha256.create();
          break;
        case "sha512WithRSAEncryption":
          cert.md = forge.md.sha512.create();
          break;
        case "RSASSA-PSS":
          cert.md = forge.md.sha256.create();
          break;
      }
    }
    if (cert.md === null) {
      var error = new Error("Could not compute certificate digest. " + "Unknown signature OID.");
      error.signatureOid = cert.signatureOid;
      throw error;
    }
    var bytes = asn1.toDer(cert.tbsCertificate);
    cert.md.update(bytes.getBytes());
  }
  var imd = forge.md.sha1.create();
  cert.issuer.getField = function (sn) {
    return _getAttribute(cert.issuer, sn);
  };
  cert.issuer.addField = function (attr) {
    _fillMissingFields([attr]);
    cert.issuer.attributes.push(attr);
  };
  cert.issuer.attributes = pki.RDNAttributesAsArray(capture.certIssuer, imd);
  if (capture.certIssuerUniqueId) {
    cert.issuer.uniqueId = capture.certIssuerUniqueId;
  }
  cert.issuer.hash = imd.digest().toHex();
  var smd = forge.md.sha1.create();
  cert.subject.getField = function (sn) {
    return _getAttribute(cert.subject, sn);
  };
  cert.subject.addField = function (attr) {
    _fillMissingFields([attr]);
    cert.subject.attributes.push(attr);
  };
  cert.subject.attributes = pki.RDNAttributesAsArray(capture.certSubject, smd);
  if (capture.certSubjectUniqueId) {
    cert.subject.uniqueId = capture.certSubjectUniqueId;
  }
  cert.subject.hash = smd.digest().toHex();
  if (capture.certExtensions) {
    cert.extensions = pki.certificateExtensionsFromAsn1(capture.certExtensions);
  } else {
    cert.extensions = [];
  }
  cert.publicKey = pki.publicKeyFromAsn1(capture.subjectPublicKeyInfo);
  return cert;
};
pki.certificateExtensionsFromAsn1 = function (exts) {
  var rval = [];
  for (var i = 0; i < exts.value.length; ++i) {
    var extseq = exts.value[i];
    for (var ei = 0; ei < extseq.value.length; ++ei) {
      rval.push(pki.certificateExtensionFromAsn1(extseq.value[ei]));
    }
  }
  return rval;
};
pki.certificateExtensionFromAsn1 = function (ext) {
  var e = {};
  e.id = asn1.derToOid(ext.value[0].value);
  e.critical = false;
  if (ext.value[1].type === asn1.Type.BOOLEAN) {
    e.critical = ext.value[1].value.charCodeAt(0) !== 0;
    e.value = ext.value[2].value;
  } else {
    e.value = ext.value[1].value;
  }
  if ((e.id in oids)) {
    e.name = oids[e.id];
    if (e.name === "keyUsage") {
      var ev = asn1.fromDer(e.value);
      var b2 = 0;
      var b3 = 0;
      if (ev.value.length > 1) {
        b2 = ev.value.charCodeAt(1);
        b3 = ev.value.length > 2 ? ev.value.charCodeAt(2) : 0;
      }
      e.digitalSignature = (b2 & 128) === 128;
      e.nonRepudiation = (b2 & 64) === 64;
      e.keyEncipherment = (b2 & 32) === 32;
      e.dataEncipherment = (b2 & 16) === 16;
      e.keyAgreement = (b2 & 8) === 8;
      e.keyCertSign = (b2 & 4) === 4;
      e.cRLSign = (b2 & 2) === 2;
      e.encipherOnly = (b2 & 1) === 1;
      e.decipherOnly = (b3 & 128) === 128;
    } else if (e.name === "basicConstraints") {
      var ev = asn1.fromDer(e.value);
      if (ev.value.length > 0 && ev.value[0].type === asn1.Type.BOOLEAN) {
        e.cA = ev.value[0].value.charCodeAt(0) !== 0;
      } else {
        e.cA = false;
      }
      var value = null;
      if (ev.value.length > 0 && ev.value[0].type === asn1.Type.INTEGER) {
        value = ev.value[0].value;
      } else if (ev.value.length > 1) {
        value = ev.value[1].value;
      }
      if (value !== null) {
        e.pathLenConstraint = asn1.derToInteger(value);
      }
    } else if (e.name === "extKeyUsage") {
      var ev = asn1.fromDer(e.value);
      for (var vi = 0; vi < ev.value.length; ++vi) {
        var oid = asn1.derToOid(ev.value[vi].value);
        if ((oid in oids)) {
          e[oids[oid]] = true;
        } else {
          e[oid] = true;
        }
      }
    } else if (e.name === "nsCertType") {
      var ev = asn1.fromDer(e.value);
      var b2 = 0;
      if (ev.value.length > 1) {
        b2 = ev.value.charCodeAt(1);
      }
      e.client = (b2 & 128) === 128;
      e.server = (b2 & 64) === 64;
      e.email = (b2 & 32) === 32;
      e.objsign = (b2 & 16) === 16;
      e.reserved = (b2 & 8) === 8;
      e.sslCA = (b2 & 4) === 4;
      e.emailCA = (b2 & 2) === 2;
      e.objCA = (b2 & 1) === 1;
    } else if (e.name === "subjectAltName" || e.name === "issuerAltName") {
      e.altNames = [];
      var gn;
      var ev = asn1.fromDer(e.value);
      for (var n = 0; n < ev.value.length; ++n) {
        gn = ev.value[n];
        var altName = {
          type: gn.type,
          value: gn.value
        };
        e.altNames.push(altName);
        switch (gn.type) {
          case 1:
          case 2:
          case 6:
            break;
          case 7:
            altName.ip = forge.util.bytesToIP(gn.value);
            break;
          case 8:
            altName.oid = asn1.derToOid(gn.value);
            break;
        }
      }
    } else if (e.name === "subjectKeyIdentifier") {
      var ev = asn1.fromDer(e.value);
      e.subjectKeyIdentifier = forge.util.bytesToHex(ev.value);
    }
  }
  return e;
};
pki.certificationRequestFromAsn1 = function (obj, computeHash) {
  var capture = {};
  var errors = [];
  if (!asn1.validate(obj, certificationRequestValidator, capture, errors)) {
    var error = new Error("Cannot read PKCS#10 certificate request. " + "ASN.1 object is not a PKCS#10 CertificationRequest.");
    error.errors = errors;
    throw error;
  }
  var oid = asn1.derToOid(capture.publicKeyOid);
  if (oid !== pki.oids.rsaEncryption) {
    throw new Error("Cannot read public key. OID is not RSA.");
  }
  var csr = pki.createCertificationRequest();
  csr.version = capture.csrVersion ? capture.csrVersion.charCodeAt(0) : 0;
  csr.signatureOid = forge.asn1.derToOid(capture.csrSignatureOid);
  csr.signatureParameters = _readSignatureParameters(csr.signatureOid, capture.csrSignatureParams, true);
  csr.siginfo.algorithmOid = forge.asn1.derToOid(capture.csrSignatureOid);
  csr.siginfo.parameters = _readSignatureParameters(csr.siginfo.algorithmOid, capture.csrSignatureParams, false);
  csr.signature = capture.csrSignature;
  csr.certificationRequestInfo = capture.certificationRequestInfo;
  if (computeHash) {
    csr.md = null;
    if ((csr.signatureOid in oids)) {
      var oid = oids[csr.signatureOid];
      switch (oid) {
        case "sha1WithRSAEncryption":
          csr.md = forge.md.sha1.create();
          break;
        case "md5WithRSAEncryption":
          csr.md = forge.md.md5.create();
          break;
        case "sha256WithRSAEncryption":
          csr.md = forge.md.sha256.create();
          break;
        case "sha512WithRSAEncryption":
          csr.md = forge.md.sha512.create();
          break;
        case "RSASSA-PSS":
          csr.md = forge.md.sha256.create();
          break;
      }
    }
    if (csr.md === null) {
      var error = new Error("Could not compute certification request digest. " + "Unknown signature OID.");
      error.signatureOid = csr.signatureOid;
      throw error;
    }
    var bytes = asn1.toDer(csr.certificationRequestInfo);
    csr.md.update(bytes.getBytes());
  }
  var smd = forge.md.sha1.create();
  csr.subject.getField = function (sn) {
    return _getAttribute(csr.subject, sn);
  };
  csr.subject.addField = function (attr) {
    _fillMissingFields([attr]);
    csr.subject.attributes.push(attr);
  };
  csr.subject.attributes = pki.RDNAttributesAsArray(capture.certificationRequestInfoSubject, smd);
  csr.subject.hash = smd.digest().toHex();
  csr.publicKey = pki.publicKeyFromAsn1(capture.subjectPublicKeyInfo);
  csr.getAttribute = function (sn) {
    return _getAttribute(csr, sn);
  };
  csr.addAttribute = function (attr) {
    _fillMissingFields([attr]);
    csr.attributes.push(attr);
  };
  csr.attributes = pki.CRIAttributesAsArray(capture.certificationRequestInfoAttributes || []);
  return csr;
};
pki.createCertificationRequest = function () {
  var csr = {};
  csr.version = 0;
  csr.signatureOid = null;
  csr.signature = null;
  csr.siginfo = {};
  csr.siginfo.algorithmOid = null;
  csr.subject = {};
  csr.subject.getField = function (sn) {
    return _getAttribute(csr.subject, sn);
  };
  csr.subject.addField = function (attr) {
    _fillMissingFields([attr]);
    csr.subject.attributes.push(attr);
  };
  csr.subject.attributes = [];
  csr.subject.hash = null;
  csr.publicKey = null;
  csr.attributes = [];
  csr.getAttribute = function (sn) {
    return _getAttribute(csr, sn);
  };
  csr.addAttribute = function (attr) {
    _fillMissingFields([attr]);
    csr.attributes.push(attr);
  };
  csr.md = null;
  csr.setSubject = function (attrs) {
    _fillMissingFields(attrs);
    csr.subject.attributes = attrs;
    csr.subject.hash = null;
  };
  csr.setAttributes = function (attrs) {
    _fillMissingFields(attrs);
    csr.attributes = attrs;
  };
  csr.sign = function (key, md) {
    csr.md = md || forge.md.sha1.create();
    var algorithmOid = oids[csr.md.algorithm + "WithRSAEncryption"];
    if (!algorithmOid) {
      var error = new Error("Could not compute certification request digest. " + "Unknown message digest algorithm OID.");
      error.algorithm = csr.md.algorithm;
      throw error;
    }
    csr.signatureOid = csr.siginfo.algorithmOid = algorithmOid;
    csr.certificationRequestInfo = pki.getCertificationRequestInfo(csr);
    var bytes = asn1.toDer(csr.certificationRequestInfo);
    csr.md.update(bytes.getBytes());
    csr.signature = key.sign(csr.md);
  };
  csr.verify = function () {
    var rval = false;
    var md = csr.md;
    if (md === null) {
      if ((csr.signatureOid in oids)) {
        var oid = oids[csr.signatureOid];
        switch (oid) {
          case "sha1WithRSAEncryption":
            md = forge.md.sha1.create();
            break;
          case "md5WithRSAEncryption":
            md = forge.md.md5.create();
            break;
          case "sha256WithRSAEncryption":
            md = forge.md.sha256.create();
            break;
          case "sha512WithRSAEncryption":
            md = forge.md.sha512.create();
            break;
          case "RSASSA-PSS":
            md = forge.md.sha256.create();
            break;
        }
      }
      if (md === null) {
        var error = new Error("Could not compute certification request digest. " + "Unknown signature OID.");
        error.signatureOid = csr.signatureOid;
        throw error;
      }
      var cri = csr.certificationRequestInfo || pki.getCertificationRequestInfo(csr);
      var bytes = asn1.toDer(cri);
      md.update(bytes.getBytes());
    }
    if (md !== null) {
      var scheme;
      switch (csr.signatureOid) {
        case oids.sha1WithRSAEncryption:
          break;
        case oids["RSASSA-PSS"]:
          var hash, mgf;
          hash = oids[csr.signatureParameters.mgf.hash.algorithmOid];
          if (hash === undefined || forge.md[hash] === undefined) {
            var error = new Error("Unsupported MGF hash function.");
            error.oid = csr.signatureParameters.mgf.hash.algorithmOid;
            error.name = hash;
            throw error;
          }
          mgf = oids[csr.signatureParameters.mgf.algorithmOid];
          if (mgf === undefined || forge.mgf[mgf] === undefined) {
            var error = new Error("Unsupported MGF function.");
            error.oid = csr.signatureParameters.mgf.algorithmOid;
            error.name = mgf;
            throw error;
          }
          mgf = forge.mgf[mgf].create(forge.md[hash].create());
          hash = oids[csr.signatureParameters.hash.algorithmOid];
          if (hash === undefined || forge.md[hash] === undefined) {
            var error = new Error("Unsupported RSASSA-PSS hash function.");
            error.oid = csr.signatureParameters.hash.algorithmOid;
            error.name = hash;
            throw error;
          }
          scheme = forge.pss.create(forge.md[hash].create(), mgf, csr.signatureParameters.saltLength);
          break;
      }
      rval = csr.publicKey.verify(md.digest().getBytes(), csr.signature, scheme);
    }
    return rval;
  };
  return csr;
};
function _dnToAsn1(obj) {
  var rval = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
  var attr, set;
  var attrs = obj.attributes;
  for (var i = 0; i < attrs.length; ++i) {
    attr = attrs[i];
    var value = attr.value;
    var valueTagClass = asn1.Type.PRINTABLESTRING;
    if (("valueTagClass" in attr)) {
      valueTagClass = attr.valueTagClass;
      if (valueTagClass === asn1.Type.UTF8) {
        value = forge.util.encodeUtf8(value);
      }
    }
    set = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(attr.type).getBytes()), asn1.create(asn1.Class.UNIVERSAL, valueTagClass, false, value)])]);
    rval.value.push(set);
  }
  return rval;
}
function _fillMissingFields(attrs) {
  var attr;
  for (var i = 0; i < attrs.length; ++i) {
    attr = attrs[i];
    if (typeof attr.name === "undefined") {
      if (attr.type && (attr.type in pki.oids)) {
        attr.name = pki.oids[attr.type];
      } else if (attr.shortName && (attr.shortName in _shortNames)) {
        attr.name = pki.oids[_shortNames[attr.shortName]];
      }
    }
    if (typeof attr.type === "undefined") {
      if (attr.name && (attr.name in pki.oids)) {
        attr.type = pki.oids[attr.name];
      } else {
        var error = new Error("Attribute type not specified.");
        error.attribute = attr;
        throw error;
      }
    }
    if (typeof attr.shortName === "undefined") {
      if (attr.name && (attr.name in _shortNames)) {
        attr.shortName = _shortNames[attr.name];
      }
    }
    if (attr.type === oids.extensionRequest) {
      attr.valueConstructed = true;
      attr.valueTagClass = asn1.Type.SEQUENCE;
      if (!attr.value && attr.extensions) {
        attr.value = [];
        for (var ei = 0; ei < attr.extensions.length; ++ei) {
          attr.value.push(pki.certificateExtensionToAsn1(_fillMissingExtensionFields(attr.extensions[ei])));
        }
      }
    }
    if (typeof attr.value === "undefined") {
      var error = new Error("Attribute value not specified.");
      error.attribute = attr;
      throw error;
    }
  }
}
function _fillMissingExtensionFields(e, options) {
  options = options || ({});
  if (typeof e.name === "undefined") {
    if (e.id && (e.id in pki.oids)) {
      e.name = pki.oids[e.id];
    }
  }
  if (typeof e.id === "undefined") {
    if (e.name && (e.name in pki.oids)) {
      e.id = pki.oids[e.name];
    } else {
      var error = new Error("Extension ID not specified.");
      error.extension = e;
      throw error;
    }
  }
  if (typeof e.value !== "undefined") {
    return e;
  }
  if (e.name === "keyUsage") {
    var unused = 0;
    var b2 = 0;
    var b3 = 0;
    if (e.digitalSignature) {
      b2 |= 128;
      unused = 7;
    }
    if (e.nonRepudiation) {
      b2 |= 64;
      unused = 6;
    }
    if (e.keyEncipherment) {
      b2 |= 32;
      unused = 5;
    }
    if (e.dataEncipherment) {
      b2 |= 16;
      unused = 4;
    }
    if (e.keyAgreement) {
      b2 |= 8;
      unused = 3;
    }
    if (e.keyCertSign) {
      b2 |= 4;
      unused = 2;
    }
    if (e.cRLSign) {
      b2 |= 2;
      unused = 1;
    }
    if (e.encipherOnly) {
      b2 |= 1;
      unused = 0;
    }
    if (e.decipherOnly) {
      b3 |= 128;
      unused = 7;
    }
    var value = String.fromCharCode(unused);
    if (b3 !== 0) {
      value += String.fromCharCode(b2) + String.fromCharCode(b3);
    } else if (b2 !== 0) {
      value += String.fromCharCode(b2);
    }
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, value);
  } else if (e.name === "basicConstraints") {
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
    if (e.cA) {
      e.value.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BOOLEAN, false, String.fromCharCode(255)));
    }
    if (("pathLenConstraint" in e)) {
      e.value.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(e.pathLenConstraint).getBytes()));
    }
  } else if (e.name === "extKeyUsage") {
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
    var seq = e.value.value;
    for (var key in e) {
      if (e[key] !== true) {
        continue;
      }
      if ((key in oids)) {
        seq.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oids[key]).getBytes()));
      } else if (key.indexOf(".") !== -1) {
        seq.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(key).getBytes()));
      }
    }
  } else if (e.name === "nsCertType") {
    var unused = 0;
    var b2 = 0;
    if (e.client) {
      b2 |= 128;
      unused = 7;
    }
    if (e.server) {
      b2 |= 64;
      unused = 6;
    }
    if (e.email) {
      b2 |= 32;
      unused = 5;
    }
    if (e.objsign) {
      b2 |= 16;
      unused = 4;
    }
    if (e.reserved) {
      b2 |= 8;
      unused = 3;
    }
    if (e.sslCA) {
      b2 |= 4;
      unused = 2;
    }
    if (e.emailCA) {
      b2 |= 2;
      unused = 1;
    }
    if (e.objCA) {
      b2 |= 1;
      unused = 0;
    }
    var value = String.fromCharCode(unused);
    if (b2 !== 0) {
      value += String.fromCharCode(b2);
    }
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, value);
  } else if (e.name === "subjectAltName" || e.name === "issuerAltName") {
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
    var altName;
    for (var n = 0; n < e.altNames.length; ++n) {
      altName = e.altNames[n];
      var value = altName.value;
      if (altName.type === 7 && altName.ip) {
        value = forge.util.bytesFromIP(altName.ip);
        if (value === null) {
          var error = new Error("Extension \"ip\" value is not a valid IPv4 or IPv6 address.");
          error.extension = e;
          throw error;
        }
      } else if (altName.type === 8) {
        if (altName.oid) {
          value = asn1.oidToDer(asn1.oidToDer(altName.oid));
        } else {
          value = asn1.oidToDer(value);
        }
      }
      e.value.value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, altName.type, false, value));
    }
  } else if (e.name === "subjectKeyIdentifier" && options.cert) {
    var ski = options.cert.generateSubjectKeyIdentifier();
    e.subjectKeyIdentifier = ski.toHex();
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, ski.getBytes());
  } else if (e.name === "authorityKeyIdentifier" && options.cert) {
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
    var seq = e.value.value;
    if (e.keyIdentifier) {
      var keyIdentifier = e.keyIdentifier === true ? options.cert.generateSubjectKeyIdentifier().getBytes() : e.keyIdentifier;
      seq.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, false, keyIdentifier));
    }
    if (e.authorityCertIssuer) {
      var authorityCertIssuer = [asn1.create(asn1.Class.CONTEXT_SPECIFIC, 4, true, [_dnToAsn1(e.authorityCertIssuer === true ? options.cert.issuer : e.authorityCertIssuer)])];
      seq.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, authorityCertIssuer));
    }
    if (e.serialNumber) {
      var serialNumber = forge.util.hexToBytes(e.serialNumber === true ? options.cert.serialNumber : e.serialNumber);
      seq.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 2, false, serialNumber));
    }
  } else if (e.name === "cRLDistributionPoints") {
    e.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
    var seq = e.value.value;
    var subSeq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
    var fullNameGeneralNames = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, []);
    var altName;
    for (var n = 0; n < e.altNames.length; ++n) {
      altName = e.altNames[n];
      var value = altName.value;
      if (altName.type === 7 && altName.ip) {
        value = forge.util.bytesFromIP(altName.ip);
        if (value === null) {
          var error = new Error("Extension \"ip\" value is not a valid IPv4 or IPv6 address.");
          error.extension = e;
          throw error;
        }
      } else if (altName.type === 8) {
        if (altName.oid) {
          value = asn1.oidToDer(asn1.oidToDer(altName.oid));
        } else {
          value = asn1.oidToDer(value);
        }
      }
      fullNameGeneralNames.value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, altName.type, false, value));
    }
    subSeq.value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [fullNameGeneralNames]));
    seq.push(subSeq);
  }
  if (typeof e.value === "undefined") {
    var error = new Error("Extension value not specified.");
    error.extension = e;
    throw error;
  }
  return e;
}
function _signatureParametersToAsn1(oid, params) {
  switch (oid) {
    case oids["RSASSA-PSS"]:
      var parts = [];
      if (params.hash.algorithmOid !== undefined) {
        parts.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(params.hash.algorithmOid).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")])]));
      }
      if (params.mgf.algorithmOid !== undefined) {
        parts.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(params.mgf.algorithmOid).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(params.mgf.hash.algorithmOid).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")])])]));
      }
      if (params.saltLength !== undefined) {
        parts.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 2, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(params.saltLength).getBytes())]));
      }
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, parts);
    default:
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "");
  }
}
function _CRIAttributesToAsn1(csr) {
  var rval = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, []);
  if (csr.attributes.length === 0) {
    return rval;
  }
  var attrs = csr.attributes;
  for (var i = 0; i < attrs.length; ++i) {
    var attr = attrs[i];
    var value = attr.value;
    var valueTagClass = asn1.Type.UTF8;
    if (("valueTagClass" in attr)) {
      valueTagClass = attr.valueTagClass;
    }
    if (valueTagClass === asn1.Type.UTF8) {
      value = forge.util.encodeUtf8(value);
    }
    var valueConstructed = false;
    if (("valueConstructed" in attr)) {
      valueConstructed = attr.valueConstructed;
    }
    var seq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(attr.type).getBytes()), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [asn1.create(asn1.Class.UNIVERSAL, valueTagClass, valueConstructed, value)])]);
    rval.value.push(seq);
  }
  return rval;
}
pki.getTBSCertificate = function (cert) {
  var tbs = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(cert.version).getBytes())]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, forge.util.hexToBytes(cert.serialNumber)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(cert.siginfo.algorithmOid).getBytes()), _signatureParametersToAsn1(cert.siginfo.algorithmOid, cert.siginfo.parameters)]), _dnToAsn1(cert.issuer), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.UTCTIME, false, asn1.dateToUtcTime(cert.validity.notBefore)), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.UTCTIME, false, asn1.dateToUtcTime(cert.validity.notAfter))]), _dnToAsn1(cert.subject), pki.publicKeyToAsn1(cert.publicKey)]);
  if (cert.issuer.uniqueId) {
    tbs.value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, String.fromCharCode(0) + cert.issuer.uniqueId)]));
  }
  if (cert.subject.uniqueId) {
    tbs.value.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 2, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, String.fromCharCode(0) + cert.subject.uniqueId)]));
  }
  if (cert.extensions.length > 0) {
    tbs.value.push(pki.certificateExtensionsToAsn1(cert.extensions));
  }
  return tbs;
};
pki.getCertificationRequestInfo = function (csr) {
  var cri = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(csr.version).getBytes()), _dnToAsn1(csr.subject), pki.publicKeyToAsn1(csr.publicKey), _CRIAttributesToAsn1(csr)]);
  return cri;
};
pki.distinguishedNameToAsn1 = function (dn) {
  return _dnToAsn1(dn);
};
pki.certificateToAsn1 = function (cert) {
  var tbsCertificate = cert.tbsCertificate || pki.getTBSCertificate(cert);
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [tbsCertificate, asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(cert.signatureOid).getBytes()), _signatureParametersToAsn1(cert.signatureOid, cert.signatureParameters)]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, String.fromCharCode(0) + cert.signature)]);
};
pki.certificateExtensionsToAsn1 = function (exts) {
  var rval = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 3, true, []);
  var seq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
  rval.value.push(seq);
  for (var i = 0; i < exts.length; ++i) {
    seq.value.push(pki.certificateExtensionToAsn1(exts[i]));
  }
  return rval;
};
pki.certificateExtensionToAsn1 = function (ext) {
  var extseq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
  extseq.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(ext.id).getBytes()));
  if (ext.critical) {
    extseq.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BOOLEAN, false, String.fromCharCode(255)));
  }
  var value = ext.value;
  if (typeof ext.value !== "string") {
    value = asn1.toDer(value).getBytes();
  }
  extseq.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, value));
  return extseq;
};
pki.certificationRequestToAsn1 = function (csr) {
  var cri = csr.certificationRequestInfo || pki.getCertificationRequestInfo(csr);
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [cri, asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(csr.signatureOid).getBytes()), _signatureParametersToAsn1(csr.signatureOid, csr.signatureParameters)]), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, String.fromCharCode(0) + csr.signature)]);
};
pki.createCaStore = function (certs) {
  var caStore = {
    certs: {}
  };
  caStore.getIssuer = function (cert) {
    var rval = getBySubject(cert.issuer);
    return rval;
  };
  caStore.addCertificate = function (cert) {
    if (typeof cert === "string") {
      cert = forge.pki.certificateFromPem(cert);
    }
    ensureSubjectHasHash(cert.subject);
    if (!caStore.hasCertificate(cert)) {
      if ((cert.subject.hash in caStore.certs)) {
        var tmp = caStore.certs[cert.subject.hash];
        if (!forge.util.isArray(tmp)) {
          tmp = [tmp];
        }
        tmp.push(cert);
        caStore.certs[cert.subject.hash] = tmp;
      } else {
        caStore.certs[cert.subject.hash] = cert;
      }
    }
  };
  caStore.hasCertificate = function (cert) {
    if (typeof cert === "string") {
      cert = forge.pki.certificateFromPem(cert);
    }
    var match = getBySubject(cert.subject);
    if (!match) {
      return false;
    }
    if (!forge.util.isArray(match)) {
      match = [match];
    }
    var der1 = asn1.toDer(pki.certificateToAsn1(cert)).getBytes();
    for (var i = 0; i < match.length; ++i) {
      var der2 = asn1.toDer(pki.certificateToAsn1(match[i])).getBytes();
      if (der1 === der2) {
        return true;
      }
    }
    return false;
  };
  caStore.listAllCertificates = function () {
    var certList = [];
    for (var hash in caStore.certs) {
      if (caStore.certs.hasOwnProperty(hash)) {
        var value = caStore.certs[hash];
        if (!forge.util.isArray(value)) {
          certList.push(value);
        } else {
          for (var i = 0; i < value.length; ++i) {
            certList.push(value[i]);
          }
        }
      }
    }
    return certList;
  };
  caStore.removeCertificate = function (cert) {
    var result;
    if (typeof cert === "string") {
      cert = forge.pki.certificateFromPem(cert);
    }
    ensureSubjectHasHash(cert.subject);
    if (!caStore.hasCertificate(cert)) {
      return null;
    }
    var match = getBySubject(cert.subject);
    if (!forge.util.isArray(match)) {
      result = caStore.certs[cert.subject.hash];
      delete caStore.certs[cert.subject.hash];
      return result;
    }
    var der1 = asn1.toDer(pki.certificateToAsn1(cert)).getBytes();
    for (var i = 0; i < match.length; ++i) {
      var der2 = asn1.toDer(pki.certificateToAsn1(match[i])).getBytes();
      if (der1 === der2) {
        result = match[i];
        match.splice(i, 1);
      }
    }
    if (match.length === 0) {
      delete caStore.certs[cert.subject.hash];
    }
    return result;
  };
  function getBySubject(subject) {
    ensureSubjectHasHash(subject);
    return caStore.certs[subject.hash] || null;
  }
  function ensureSubjectHasHash(subject) {
    if (!subject.hash) {
      var md = forge.md.sha1.create();
      subject.attributes = pki.RDNAttributesAsArray(_dnToAsn1(subject), md);
      subject.hash = md.digest().toHex();
    }
  }
  if (certs) {
    for (var i = 0; i < certs.length; ++i) {
      var cert = certs[i];
      caStore.addCertificate(cert);
    }
  }
  return caStore;
};
pki.certificateError = {
  bad_certificate: "forge.pki.BadCertificate",
  unsupported_certificate: "forge.pki.UnsupportedCertificate",
  certificate_revoked: "forge.pki.CertificateRevoked",
  certificate_expired: "forge.pki.CertificateExpired",
  certificate_unknown: "forge.pki.CertificateUnknown",
  unknown_ca: "forge.pki.UnknownCertificateAuthority"
};
pki.verifyCertificateChain = function (caStore, chain, verify) {
  chain = chain.slice(0);
  var certs = chain.slice(0);
  var now = new Date();
  var first = true;
  var error = null;
  var depth = 0;
  do {
    var cert = chain.shift();
    var parent = null;
    var selfSigned = false;
    if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
      error = {
        message: "Certificate is not valid yet or has expired.",
        error: pki.certificateError.certificate_expired,
        notBefore: cert.validity.notBefore,
        notAfter: cert.validity.notAfter,
        now: now
      };
    }
    if (error === null) {
      parent = chain[0] || caStore.getIssuer(cert);
      if (parent === null) {
        if (cert.isIssuer(cert)) {
          selfSigned = true;
          parent = cert;
        }
      }
      if (parent) {
        var parents = parent;
        if (!forge.util.isArray(parents)) {
          parents = [parents];
        }
        var verified = false;
        while (!verified && parents.length > 0) {
          parent = parents.shift();
          try {
            verified = parent.verify(cert);
          } catch (ex) {}
        }
        if (!verified) {
          error = {
            message: "Certificate signature is invalid.",
            error: pki.certificateError.bad_certificate
          };
        }
      }
      if (error === null && (!parent || selfSigned) && !caStore.hasCertificate(cert)) {
        error = {
          message: "Certificate is not trusted.",
          error: pki.certificateError.unknown_ca
        };
      }
    }
    if (error === null && parent && !cert.isIssuer(parent)) {
      error = {
        message: "Certificate issuer is invalid.",
        error: pki.certificateError.bad_certificate
      };
    }
    if (error === null) {
      var se = {
        keyUsage: true,
        basicConstraints: true
      };
      for (var i = 0; error === null && i < cert.extensions.length; ++i) {
        var ext = cert.extensions[i];
        if (ext.critical && !((ext.name in se))) {
          error = {
            message: "Certificate has an unsupported critical extension.",
            error: pki.certificateError.unsupported_certificate
          };
        }
      }
    }
    if (error === null && (!first || chain.length === 0 && (!parent || selfSigned))) {
      var bcExt = cert.getExtension("basicConstraints");
      var keyUsageExt = cert.getExtension("keyUsage");
      if (keyUsageExt !== null) {
        if (!keyUsageExt.keyCertSign || bcExt === null) {
          error = {
            message: "Certificate keyUsage or basicConstraints conflict " + "or indicate that the certificate is not a CA. " + "If the certificate is the only one in the chain or " + "isn't the first then the certificate must be a " + "valid CA.",
            error: pki.certificateError.bad_certificate
          };
        }
      }
      if (error === null && bcExt !== null && !bcExt.cA) {
        error = {
          message: "Certificate basicConstraints indicates the certificate " + "is not a CA.",
          error: pki.certificateError.bad_certificate
        };
      }
      if (error === null && keyUsageExt !== null && ("pathLenConstraint" in bcExt)) {
        var pathLen = depth - 1;
        if (pathLen > bcExt.pathLenConstraint) {
          error = {
            message: "Certificate basicConstraints pathLenConstraint violated.",
            error: pki.certificateError.bad_certificate
          };
        }
      }
    }
    var vfd = error === null ? true : error.error;
    var ret = verify ? verify(vfd, depth, certs) : vfd;
    if (ret === true) {
      error = null;
    } else {
      if (vfd === true) {
        error = {
          message: "The application rejected the certificate.",
          error: pki.certificateError.bad_certificate
        };
      }
      if (ret || ret === 0) {
        if (typeof ret === "object" && !forge.util.isArray(ret)) {
          if (ret.message) {
            error.message = ret.message;
          }
          if (ret.error) {
            error.error = ret.error;
          }
        } else if (typeof ret === "string") {
          error.error = ret;
        }
      }
      throw error;
    }
    first = false;
    ++depth;
  } while (chain.length > 0);
  return true;
};

export { forge as default };
