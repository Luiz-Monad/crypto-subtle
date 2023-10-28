import 'module';
import './util.js';
import './jsbn.js';
import './random.js';

var forge = global.forge;
if (forge.prime) ;
var prime = forge.prime = forge.prime || ({});
var BigInteger = forge.jsbn.BigInteger;
var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];
var THIRTY = new BigInteger(null);
THIRTY.fromInt(30);
var op_or = function (x, y) {
  return x | y;
};
prime.generateProbablePrime = function (bits, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || ({});
  var algorithm = options.algorithm || "PRIMEINC";
  if (typeof algorithm === "string") {
    algorithm = {
      name: algorithm
    };
  }
  algorithm.options = algorithm.options || ({});
  var prng = options.prng || forge.random;
  var rng = {
    nextBytes: function (x) {
      var b = prng.getBytesSync(x.length);
      for (var i = 0; i < x.length; ++i) {
        x[i] = b.charCodeAt(i);
      }
    }
  };
  if (algorithm.name === "PRIMEINC") {
    return primeincFindPrime(bits, rng, algorithm.options, callback);
  }
  throw new Error("Invalid prime generation algorithm: " + algorithm.name);
};
function primeincFindPrime(bits, rng, options, callback) {
  if (("workers" in options)) {
    return primeincFindPrimeWithWorkers(bits, rng, options, callback);
  }
  return primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
}
function primeincFindPrimeWithoutWorkers(bits, rng, options, callback) {
  var num = generateRandom(bits, rng);
  var deltaIdx = 0;
  var mrTests = getMillerRabinTests(num.bitLength());
  if (("millerRabinTests" in options)) {
    mrTests = options.millerRabinTests;
  }
  var maxBlockTime = 10;
  if (("maxBlockTime" in options)) {
    maxBlockTime = options.maxBlockTime;
  }
  var start = +new Date();
  do {
    if (num.bitLength() > bits) {
      num = generateRandom(bits, rng);
    }
    if (num.isProbablePrime(mrTests)) {
      return callback(null, num);
    }
    num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
  } while (maxBlockTime < 0 || +new Date() - start < maxBlockTime);
  forge.util.setImmediate(function () {
    primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
  });
}
function primeincFindPrimeWithWorkers(bits, rng, options, callback) {
  if (typeof Worker === "undefined") {
    return primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
  }
  var num = generateRandom(bits, rng);
  var numWorkers = options.workers;
  var workLoad = options.workLoad || 100;
  var range = workLoad * 30 / 8;
  var workerScript = options.workerScript || "forge/prime.worker.js";
  if (numWorkers === -1) {
    return forge.util.estimateCores(function (err, cores) {
      if (err) {
        cores = 2;
      }
      numWorkers = cores - 1;
      generate();
    });
  }
  generate();
  function generate() {
    numWorkers = Math.max(1, numWorkers);
    var workers = [];
    for (var i = 0; i < numWorkers; ++i) {
      workers[i] = new Worker(workerScript);
    }
    for (var i = 0; i < numWorkers; ++i) {
      workers[i].addEventListener("message", workerMessage);
    }
    var found = false;
    function workerMessage(e) {
      if (found) {
        return;
      }
      var data = e.data;
      if (data.found) {
        for (var i = 0; i < workers.length; ++i) {
          workers[i].terminate();
        }
        found = true;
        return callback(null, new BigInteger(data.prime, 16));
      }
      if (num.bitLength() > bits) {
        num = generateRandom(bits, rng);
      }
      var hex = num.toString(16);
      e.target.postMessage({
        hex: hex,
        workLoad: workLoad
      });
      num.dAddOffset(range, 0);
    }
  }
}
function generateRandom(bits, rng) {
  var num = new BigInteger(bits, rng);
  var bits1 = bits - 1;
  if (!num.testBit(bits1)) {
    num.bitwiseTo(BigInteger.ONE.shiftLeft(bits1), op_or, num);
  }
  num.dAddOffset(31 - num.mod(THIRTY).byteValue(), 0);
  return num;
}
function getMillerRabinTests(bits) {
  if (bits <= 100) return 27;
  if (bits <= 150) return 18;
  if (bits <= 200) return 15;
  if (bits <= 250) return 12;
  if (bits <= 300) return 9;
  if (bits <= 350) return 8;
  if (bits <= 400) return 7;
  if (bits <= 500) return 6;
  if (bits <= 600) return 5;
  if (bits <= 800) return 4;
  if (bits <= 1250) return 3;
  return 2;
}

export { forge as default };
