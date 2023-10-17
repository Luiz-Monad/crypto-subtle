import 'module';
import Enc from './encoding.js';

var PEM = global.PEM;
var PEM = module.exports;
PEM.packBlock = function (opts) {
  return "-----BEGIN " + opts.type + "-----\n" + Enc.bufToBase64(opts.bytes).match(/.{1,64}/g).join("\n") + "\n" + "-----END " + opts.type + "-----";
};
var PEM$1 = PEM;

export { PEM$1 as default };
