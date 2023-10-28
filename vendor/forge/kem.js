import 'module';
import './util.js';
import './random.js';
import './jsbn.js';

var forge = global.forge;
forge.kem = forge.kem || ({});
var BigInteger = forge.jsbn.BigInteger;
forge.kem.rsa = {};
forge.kem.rsa.create = function (kdf, options) {
  options = options || ({});
  var prng = options.prng || forge.random;
  var kem = {};
  kem.encrypt = function (publicKey, keyLength) {
    var byteLength = Math.ceil(publicKey.n.bitLength() / 8);
    var r;
    do {
      r = new BigInteger(forge.util.bytesToHex(prng.getBytesSync(byteLength)), 16).mod(publicKey.n);
    } while (r.equals(BigInteger.ZERO));
    r = forge.util.hexToBytes(r.toString(16));
    var zeros = byteLength - r.length;
    if (zeros > 0) {
      r = forge.util.fillString(String.fromCharCode(0), zeros) + r;
    }
    var encapsulation = publicKey.encrypt(r, "NONE");
    var key = kdf.generate(r, keyLength);
    return {
      encapsulation: encapsulation,
      key: key
    };
  };
  kem.decrypt = function (privateKey, encapsulation, keyLength) {
    var r = privateKey.decrypt(encapsulation, "NONE");
    return kdf.generate(r, keyLength);
  };
  return kem;
};
forge.kem.kdf1 = function (md, digestLength) {
  _createKDF(this, md, 0, digestLength || md.digestLength);
};
forge.kem.kdf2 = function (md, digestLength) {
  _createKDF(this, md, 1, digestLength || md.digestLength);
};
function _createKDF(kdf, md, counterStart, digestLength) {
  kdf.generate = function (x, length) {
    var key = new forge.util.ByteBuffer();
    var k = Math.ceil(length / digestLength) + counterStart;
    var c = new forge.util.ByteBuffer();
    for (var i = counterStart; i < k; ++i) {
      c.putInt32(i);
      md.start();
      md.update(x + c.getBytes());
      var hash = md.digest();
      key.putBytes(hash.getBytes(digestLength));
    }
    key.truncate(key.length() - length);
    return key.getBytes();
  };
}

export { forge as default };
