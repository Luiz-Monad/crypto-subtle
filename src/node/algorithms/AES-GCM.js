var sjcl      = require("sjcl")
  , Algorithm = require("./abstract")("AES-GCM")
  , Bufferize = require('./../../bufferize')
  , AES       = require("./shared/AES")
  , secret    = Algorithm.types.secret.usage

AES(Algorithm);

secret.encrypt = createEncrypt;
secret.decrypt = createDecrypt;

module.exports = Algorithm;

function getParams(alg, data){
  var iv = Bufferize(alg.iv);
  var additionalData = alg.additionalData ? Bufferize(alg.additionalData) : new Buffer([]);

  data = data ? Bufferize(data) : new Buffer([]);

  return { iv   : sjcl.codec.hex.toBits(iv.toString('hex'))
         , add  : sjcl.codec.hex.toBits(additionalData.toString('hex'))
         , data : sjcl.codec.hex.toBits(data.toString('hex'))
         };
}

function CRYPT(action, Key, alg, data){
  var p = getParams(alg, data);
  return new Buffer(sjcl.codec.hex.fromBits(sjcl.mode.gcm[action](Key, p.data , p.iv, p.add, alg.tagLength)), 'hex');
}
function createEncrypt(Key){
  return function ENCRYPT_AES_GCM(alg, data){
    return CRYPT("encrypt", Key, alg, data);
  };
}

function createDecrypt(Key){
  return function DECRYPT_AES_GCM(alg,data ){
    return CRYPT("decrypt", Key, alg, data);
  }
}

function checkParams(){
  return;
}
