import { __module as generatePrivkeyNode } from './_virtual/generate-privkey-node.js';
import require$$0 from 'keypairs';
import require$$4 from 'crypto';

generatePrivkeyNode.exports;

var hasRequiredGeneratePrivkeyNode;

function requireGeneratePrivkeyNode () {
	if (hasRequiredGeneratePrivkeyNode) return generatePrivkeyNode.exports;
	hasRequiredGeneratePrivkeyNode = 1;
	(function (module) {

		var Keypairs = require$$0;
		module.exports = function (bitlen, exp) {
		  var keypair = require$$4.generateKeyPairSync('rsa', {
		    modulusLength: bitlen,
		    publicExponent: exp,
		    privateKeyEncoding: {
		      type: 'pkcs1',
		      format: 'pem'
		    },
		    publicKeyEncoding: {
		      type: 'pkcs1',
		      format: 'pem'
		    }
		  });
		  var result = {
		    publicKeyPem: keypair.publicKey.trim(),
		    privateKeyPem: keypair.privateKey.trim()
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
	} (generatePrivkeyNode));
	return generatePrivkeyNode.exports;
}

export { requireGeneratePrivkeyNode as __require };
