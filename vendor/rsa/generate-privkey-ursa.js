import { __module as generatePrivkeyUrsa } from './_virtual/generate-privkey-ursa.js';
import require$$0 from 'keypairs';
import require$$2 from 'ursa-optional';

generatePrivkeyUrsa.exports;

var hasRequiredGeneratePrivkeyUrsa;

function requireGeneratePrivkeyUrsa () {
	if (hasRequiredGeneratePrivkeyUrsa) return generatePrivkeyUrsa.exports;
	hasRequiredGeneratePrivkeyUrsa = 1;
	(function (module) {

		var Keypairs = require$$0;
		module.exports = function (bitlen, exp) {
		  var ursa;
		  try {
		    ursa = require('ursa');
		  } catch (e) {
		    ursa = require$$2;
		  }
		  var keypair = ursa.generatePrivateKey(bitlen, exp);
		  var result = {
		    publicKeyPem: keypair.toPublicPem().toString('ascii').trim(),
		    privateKeyPem: keypair.toPrivatePem().toString('ascii').trim()
		  };
		  result.publicKeyJwk = Keypairs._importSync({
		    pem: result.publicKeyPem,
		    "public": true
		  });
		  result.privateKeyJwk = Keypairs._importSync({
		    pem: result.privateKeyPem
		  });
		  return result;
		};
		if (require.main === module) {
		  var keypair = module.exports(2048, 0x10001);
		  console.info(keypair.privateKeyPem);
		  console.warn(keypair.publicKeyPem);
		  //console.info(keypair.privateKeyJwk);
		  //console.warn(keypair.publicKeyJwk);
		} 
	} (generatePrivkeyUrsa));
	return generatePrivkeyUrsa.exports;
}

export { requireGeneratePrivkeyUrsa as __require };
