import { __module as generatePrivkey } from './_virtual/generate-privkey.js';
import { __require as requireGeneratePrivkeyNode } from './generate-privkey-node.js';
import { __require as requireGeneratePrivkeyUrsa } from './generate-privkey-ursa.js';
import require$$2 from 'os';
import { __require as requireGeneratePrivkeyForge } from './generate-privkey-forge.js';

generatePrivkey.exports;

var hasRequiredGeneratePrivkey;

function requireGeneratePrivkey () {
	if (hasRequiredGeneratePrivkey) return generatePrivkey.exports;
	hasRequiredGeneratePrivkey = 1;
	(function (module) {

		var oldver = false;
		module.exports = function (bitlen, exp) {
		  bitlen = parseInt(bitlen, 10) || 2048;
		  exp = parseInt(exp, 10) || 65537;
		  try {
		    return requireGeneratePrivkeyNode()(bitlen, exp);
		  } catch (e) {
		    if (!/generateKeyPairSync is not a function/.test(e.message)) {
		      throw e;
		    }
		    try {
		      return requireGeneratePrivkeyUrsa()(bitlen, exp);
		    } catch (e) {
		      if (e.code !== 'MODULE_NOT_FOUND') {
		        console.error("[rsa-compat] Unexpected error when using 'ursa':");
		        console.error(e);
		      }
		      if (!oldver) {
		        oldver = true;
		        console.warn("[WARN] rsa-compat: Your version of node does not have crypto.generateKeyPair()");
		        console.warn("[WARN] rsa-compat: Please update to node >= v10.12 or 'npm install ursa'");
		        console.warn("[WARN] rsa-compat: Using node-forge as a fallback, but it may be unacceptably slow.");
		        if (/arm|mips/i.test(require$$2.arch)) {
		          console.warn("================================================================");
		          console.warn("                         WARNING");
		          console.warn("================================================================");
		          console.warn("");
		          console.warn("WARNING: You are generating an RSA key using pure JavaScript on");
		          console.warn("         a VERY SLOW cpu. This could take DOZENS of minutes!");
		          console.warn("");
		          console.warn("         We recommend installing node >= v10.12, or 'gcc' and 'ursa'");
		          console.warn("");
		          console.warn("EXAMPLE:");
		          console.warn("");
		          console.warn("        sudo apt-get install build-essential && npm install ursa");
		          console.warn("");
		          console.warn("================================================================");
		        }
		      }
		      try {
		        return requireGeneratePrivkeyForge()(bitlen, exp);
		      } catch (e) {
		        console.error("[ERROR] rsa-compat: could not generate a private key.");
		        console.error("None of crypto.generateKeyPair, ursa, nor node-forge are present");
		        console.error("");
		        throw e;
		      }
		    }
		  }
		};
		if (require.main === module) {
		  var keypair = module.exports(2048, 0x10001);
		  console.info(keypair.privateKeyPem);
		  console.warn(keypair.publicKeyPem);
		  //console.info(keypair.privateKeyJwk);
		  //console.warn(keypair.publicKeyJwk);
		} 
	} (generatePrivkey));
	return generatePrivkey.exports;
}

export { requireGeneratePrivkey as __require };
