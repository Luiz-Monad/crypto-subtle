import 'module';

var sjcl = global.sjcl;
sjcl.misc.hkdf = function (ikm, keyBitLength, salt, info, Hash) {
  var hmac, key, i, hashLen, loops, curOut, ret = [];
  Hash = Hash || sjcl.hash.sha256;
  if (typeof info === "string") {
    info = sjcl.codec.utf8String.toBits(info);
  }
  if (typeof salt === "string") {
    salt = sjcl.codec.utf8String.toBits(salt);
  } else if (!salt) {
    salt = [];
  }
  hmac = new sjcl.misc.hmac(salt, Hash);
  key = hmac.mac(ikm);
  hashLen = sjcl.bitArray.bitLength(key);
  loops = Math.ceil(keyBitLength / hashLen);
  if (loops > 255) {
    throw new sjcl.exception.invalid("key bit length is too large for hkdf");
  }
  hmac = new sjcl.misc.hmac(key, Hash);
  curOut = [];
  for (i = 1; i <= loops; i++) {
    hmac.update(curOut);
    hmac.update(info);
    hmac.update([sjcl.bitArray.partial(8, i)]);
    curOut = hmac.digest();
    ret = sjcl.bitArray.concat(ret, curOut);
  }
  return sjcl.bitArray.clamp(ret, keyBitLength);
};

export { sjcl as default };
