var Algorithm  = require("./abstract")("HMAC")
  , forge      = require("node-forge")
  , secret     = Algorithm.types.secret.usage
  , raw        = Algorithm.formats.raw;

module.exports = Algorithm;

secret.sign    = createSign;
secret.verify  = createVerify;

raw.import = raw_import;

function createSign(key, alg1){
  return function HMAC_SIGN(alg, buf) {
    const hmac = forge.hmac.create();
    const hashKey = alg1.hash.name.replace(/-/g, '').toLowerCase();
    hmac.start({ md: forge.md[hashKey], key: key });
    hmac.update(forge.util.createBuffer(buf));
    return Buffer.from(hmac.digest().getBytes(), 'binary');
  };
}

function createVerify(key, alg1) {
  return function HMAC_VERIFY(alg, buf, sig) {
    const hmac = forge.hmac.create();
    const hashKey = alg1.hash.name.replace(/-/g, '').toLowerCase();
    hmac.start({ md: forge.md[hashKey], key: key });
    hmac.update(forge.util.createBuffer(buf));
    const computedSignature = Buffer.from(hmac.digest().getBytes(), 'binary');
    return Buffer.compare(sig, computedSignature) === 0;
  };
}

function raw_import(bytes){
  return bytes;
}

function raw_export(key){
  return key;
}
