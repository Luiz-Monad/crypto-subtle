import { __module as generatePrivkeyForge } from './_virtual/generate-privkey-forge.js';
import require$$0 from 'keypairs';
import require$$1 from 'node-forge';

generatePrivkeyForge.exports;

var hasRequiredGeneratePrivkeyForge;

function requireGeneratePrivkeyForge () {
	if (hasRequiredGeneratePrivkeyForge) return generatePrivkeyForge.exports;
	hasRequiredGeneratePrivkeyForge = 1;
	(function (module) {

		var Keypairs = require$$0;
		module.exports = function (bitlen, exp) {
		  var k = require$$1.pki.rsa.generateKeyPair({
		    bits: bitlen || 2048,
		    e: exp || 0x10001
		  }).privateKey;
		  var jwk = {
		    kty: "RSA",
		    n: _toUrlBase64(k.n),
		    e: _toUrlBase64(k.e),
		    d: _toUrlBase64(k.d),
		    p: _toUrlBase64(k.p),
		    q: _toUrlBase64(k.q),
		    dp: _toUrlBase64(k.dP),
		    dq: _toUrlBase64(k.dQ),
		    qi: _toUrlBase64(k.qInv)
		  };
		  return {
		    publicKeyPem: Keypairs._exportSync({
		      jwk: jwk,
		      "public": true
		    }),
		    privateKeyPem: Keypairs._exportSync({
		      jwk: jwk
		    }),
		    privateKeyJwk: jwk,
		    publicKeyJwk: {
		      kty: jwk.kty,
		      n: jwk.n,
		      e: jwk.e
		    }
		  };
		};
		function _toUrlBase64(fbn) {
		  var hex = fbn.toRadix(16);
		  if (hex.length % 2) {
		    // Invalid hex string
		    hex = '0' + hex;
		  }
		  while ('00' === hex.slice(0, 2)) {
		    hex = hex.slice(2);
		  }
		  return Buffer.from(hex, 'hex').toString('base64').replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
		}
		if (require.main === module) {
		  var keypair = module.exports(2048, 0x10001);
		  console.info(keypair.privateKeyPem);
		  console.warn(keypair.publicKeyPem);
		  //console.info(keypair.privateKeyJwk);
		  //console.warn(keypair.publicKeyJwk);
		} 
	} (generatePrivkeyForge));
	return generatePrivkeyForge.exports;
}

export { requireGeneratePrivkeyForge as __require };
