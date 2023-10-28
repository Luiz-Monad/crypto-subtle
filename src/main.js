var Browser = null
if (typeof process === 'object' && process.versions && process.versions.node) {
  function reject(){
    return Promise.reject("operation unsupported")
  }
  Browser = reject;  
} else {
  Browser = function tryBrowser (routine, args){
    return crypto.subtle[routine].apply(crypto.subtle, args);
  }
}
var NodeBuffer = require("buffer")
global.Buffer = global.Buffer || NodeBuffer;
var NodeCrypto = require("crypto");
var OPS = ["generateKey", "importKey", "exportKey", "sign", "verify", "encrypt", "decrypt", "digest", "deriveKey", "deriveBits"]
var nonce = NodeCrypto.randomBytes(64).toString("hex")
var Bufferize = require('./bufferize')
global.FORGE = require("node-forge")
var Subtle = {}
var JS = {}
JS.generateKey = require("./node/generateKey")
JS.importKey = require("./node/importKey")
JS.exportKey = require("./node/exportKey")
JS.sign = require("./node/sign")
JS.verify = require("./node/verify")
JS.encrypt = require("./node/encrypt")
JS.decrypt = require("./node/decrypt")
JS.digest = require("./node/digest")
JS.deriveKey = require("./node/deriveKey")
JS.deriveBits = require("./node/deriveBits")
JS.CryptoKey = require("./node/CryptoKey")

function makeArgArray (args){
  var ar = []
  for (var i = 0; i < args.length;i++)
    ar.push(Bufferize(args[i]))

  ar.push(nonce);
  return ar;
}

function makeRoutine(routine){
  return function(){
    var routineArgs = makeArgArray(arguments)
    return Browser(routine, arguments).then(Bufferize).catch(function useJScrypto(er){
      ////console.log("BROWSER FAILED",er, routineArgs)
      return (typeof JS[routine] === "function") ? JS[routine].apply(JS[routine],routineArgs)
                                                 : Promise.reject("unsupported operation");
    });
  }
}

for (var i in OPS){
  var routine = OPS[i]
  Subtle[routine] = makeRoutine(routine + "");
}

Subtle._CryptoKey = global.CryptoKey || JS.CryptoKey;

module.exports = Subtle;
