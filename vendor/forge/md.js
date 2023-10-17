import 'module';
import './md5.js';
import './sha1.js';
import './sha256.js';
import './sha512.js';

var forge = global.forge;
forge.md = forge.md || ({});
forge.md.algorithms = {
  md5: forge.md5,
  sha1: forge.sha1,
  sha256: forge.sha256
};
forge.md.md5 = forge.md5;
forge.md.sha1 = forge.sha1;
forge.md.sha256 = forge.sha256;

export { forge as default };
