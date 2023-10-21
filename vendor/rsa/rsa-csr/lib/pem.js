import { __module as pem } from '../../_virtual/pem.js';
import { encodingExports } from './encoding.js';

(function (module) {

	var Enc = encodingExports;
	var PEM = module.exports;
	PEM.packBlock = function (opts) {
	  // TODO allow for headers?
	  return '-----BEGIN ' + opts.type + '-----\n' + Enc.bufToBase64(opts.bytes).match(/.{1,64}/g).join('\n') + '\n' + '-----END ' + opts.type + '-----';
	}; 
} (pem));

var pemExports = pem.exports;

export { pemExports };
