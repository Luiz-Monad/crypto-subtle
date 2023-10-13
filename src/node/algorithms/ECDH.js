var Algorithm = require("./abstract")("ECDH")
  , ECC       = require("./shared/ECC")
  , forge     = require("node-forge")
  , _private  = Algorithm.types.private.usage;

ECC(Algorithm);

Algorithm.checkParams = checkParams;

_private.deriveBits = createDeriveBits;

module.exports = Algorithm;

function createDeriveBits(privateKeyPem, publicKeyPem) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const sharedSecret = privateKey.computeSecret(publicKey);
  const sharedSecretBytes = sharedSecret.toBytes();
  return Buffer.from(sharedSecretBytes);
}

function checkParams(format, algorithm, usages){
}
