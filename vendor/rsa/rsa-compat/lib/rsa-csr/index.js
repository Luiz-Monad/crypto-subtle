import 'module';
import a from './lib/csr.js';

var module = global.module;
module.exports = a;

export { module as default };
