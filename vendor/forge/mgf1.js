import 'module';
import './util.js';

var forge = global.forge;
forge.mgf = forge.mgf || ({});
var mgf1 = forge.mgf.mgf1 = forge.mgf1 = forge.mgf1 || ({});
mgf1.create = function (md) {
  var mgf = {
    generate: function (seed, maskLen) {
      var t = new forge.util.ByteBuffer();
      var len = Math.ceil(maskLen / md.digestLength);
      for (var i = 0; i < len; i++) {
        var c = new forge.util.ByteBuffer();
        c.putInt32(i);
        md.start();
        md.update(seed + c.getBytes());
        t.putBuffer(md.digest());
      }
      t.truncate(t.length() - maskLen);
      return t.getBytes();
    }
  };
  return mgf;
};

export { forge as default };
