import 'module';
import './asn1.js';
import './oids.js';
import './pbe.js';
import './pem.js';
import './pbkdf2.js';
import './pkcs12.js';
import './pss.js';
import './rsa.js';
import './util.js';
import './x509.js';

var forge = global.forge;
var asn1 = forge.asn1;
var pki = forge.pki = forge.pki || ({});
pki.pemToDer = function (pem) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert PEM to DER; PEM is encrypted.");
  }
  return forge.util.createBuffer(msg.body);
};
pki.privateKeyFromPem = function (pem) {
  var msg = forge.pem.decode(pem)[0];
  if (msg.type !== "PRIVATE KEY" && msg.type !== "RSA PRIVATE KEY") {
    var error = new Error("Could not convert private key from PEM; PEM " + "header type is not \"PRIVATE KEY\" or \"RSA PRIVATE KEY\".");
    error.headerType = msg.type;
    throw error;
  }
  if (msg.procType && msg.procType.type === "ENCRYPTED") {
    throw new Error("Could not convert private key from PEM; PEM is encrypted.");
  }
  var obj = asn1.fromDer(msg.body);
  return pki.privateKeyFromAsn1(obj);
};
pki.privateKeyToPem = function (key, maxline) {
  var msg = {
    type: "RSA PRIVATE KEY",
    body: asn1.toDer(pki.privateKeyToAsn1(key)).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};
pki.privateKeyInfoToPem = function (pki, maxline) {
  var msg = {
    type: "PRIVATE KEY",
    body: asn1.toDer(pki).getBytes()
  };
  return forge.pem.encode(msg, {
    maxline: maxline
  });
};

export { forge as default };
