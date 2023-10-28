import 'module';
import './aes.js';
import './hmac.js';
import './md5.js';
import './sha1.js';
import './util.js';

var forge = global.forge;
var ssh = forge.ssh = forge.ssh || ({});
ssh.privateKeyToPutty = function (privateKey, passphrase, comment) {
  comment = comment || "";
  passphrase = passphrase || "";
  var algorithm = "ssh-rsa";
  var encryptionAlgorithm = passphrase === "" ? "none" : "aes256-cbc";
  var ppk = "PuTTY-User-Key-File-2: " + algorithm + "\r\n";
  ppk += "Encryption: " + encryptionAlgorithm + "\r\n";
  ppk += "Comment: " + comment + "\r\n";
  var pubbuffer = forge.util.createBuffer();
  _addStringToBuffer(pubbuffer, algorithm);
  _addBigIntegerToBuffer(pubbuffer, privateKey.e);
  _addBigIntegerToBuffer(pubbuffer, privateKey.n);
  var pub = forge.util.encode64(pubbuffer.bytes(), 64);
  var length = Math.floor(pub.length / 66) + 1;
  ppk += "Public-Lines: " + length + "\r\n";
  ppk += pub;
  var privbuffer = forge.util.createBuffer();
  _addBigIntegerToBuffer(privbuffer, privateKey.d);
  _addBigIntegerToBuffer(privbuffer, privateKey.p);
  _addBigIntegerToBuffer(privbuffer, privateKey.q);
  _addBigIntegerToBuffer(privbuffer, privateKey.qInv);
  var priv;
  if (!passphrase) {
    priv = forge.util.encode64(privbuffer.bytes(), 64);
  } else {
    var encLen = privbuffer.length() + 16 - 1;
    encLen -= encLen % 16;
    var padding = _sha1(privbuffer.bytes());
    padding.truncate(padding.length() - encLen + privbuffer.length());
    privbuffer.putBuffer(padding);
    var aeskey = forge.util.createBuffer();
    aeskey.putBuffer(_sha1("\u0000\u0000\u0000\u0000", passphrase));
    aeskey.putBuffer(_sha1("\u0000\u0000\u0000\u0001", passphrase));
    var cipher = forge.aes.createEncryptionCipher(aeskey.truncate(8), "CBC");
    cipher.start(forge.util.createBuffer().fillWithByte(0, 16));
    cipher.update(privbuffer.copy());
    cipher.finish();
    var encrypted = cipher.output;
    encrypted.truncate(16);
    priv = forge.util.encode64(encrypted.bytes(), 64);
  }
  length = Math.floor(priv.length / 66) + 1;
  ppk += "\r\nPrivate-Lines: " + length + "\r\n";
  ppk += priv;
  var mackey = _sha1("putty-private-key-file-mac-key", passphrase);
  var macbuffer = forge.util.createBuffer();
  _addStringToBuffer(macbuffer, algorithm);
  _addStringToBuffer(macbuffer, encryptionAlgorithm);
  _addStringToBuffer(macbuffer, comment);
  macbuffer.putInt32(pubbuffer.length());
  macbuffer.putBuffer(pubbuffer);
  macbuffer.putInt32(privbuffer.length());
  macbuffer.putBuffer(privbuffer);
  var hmac = forge.hmac.create();
  hmac.start("sha1", mackey);
  hmac.update(macbuffer.bytes());
  ppk += "\r\nPrivate-MAC: " + hmac.digest().toHex() + "\r\n";
  return ppk;
};
ssh.publicKeyToOpenSSH = function (key, comment) {
  var type = "ssh-rsa";
  comment = comment || "";
  var buffer = forge.util.createBuffer();
  _addStringToBuffer(buffer, type);
  _addBigIntegerToBuffer(buffer, key.e);
  _addBigIntegerToBuffer(buffer, key.n);
  return type + " " + forge.util.encode64(buffer.bytes()) + " " + comment;
};
ssh.privateKeyToOpenSSH = function (privateKey, passphrase) {
  if (!passphrase) {
    return forge.pki.privateKeyToPem(privateKey);
  }
  return forge.pki.encryptRsaPrivateKey(privateKey, passphrase, {
    legacy: true,
    algorithm: "aes128"
  });
};
ssh.getPublicKeyFingerprint = function (key, options) {
  options = options || ({});
  var md = options.md || forge.md.md5.create();
  var type = "ssh-rsa";
  var buffer = forge.util.createBuffer();
  _addStringToBuffer(buffer, type);
  _addBigIntegerToBuffer(buffer, key.e);
  _addBigIntegerToBuffer(buffer, key.n);
  md.start();
  md.update(buffer.getBytes());
  var digest = md.digest();
  if (options.encoding === "hex") {
    var hex = digest.toHex();
    if (options.delimiter) {
      return hex.match(/.{2}/g).join(options.delimiter);
    }
    return hex;
  } else if (options.encoding === "binary") {
    return digest.getBytes();
  } else if (options.encoding) {
    throw new Error("Unknown encoding \"" + options.encoding + "\".");
  }
  return digest;
};
function _addBigIntegerToBuffer(buffer, val) {
  var hexVal = val.toString(16);
  if (hexVal[0] >= "8") {
    hexVal = "00" + hexVal;
  }
  var bytes = forge.util.hexToBytes(hexVal);
  buffer.putInt32(bytes.length);
  buffer.putBytes(bytes);
}
function _addStringToBuffer(buffer, val) {
  buffer.putInt32(val.length);
  buffer.putString(val);
}
function _sha1() {
  var sha = forge.md.sha1.create();
  var num = arguments.length;
  for (var i = 0; i < num; ++i) {
    sha.update(arguments[i]);
  }
  return sha.digest();
}

export { forge as default };
