function randomBytes(length) {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Platform does not support secure random numbers');
  }
  if (!Number.isInteger(length) || length <= 0 || length > 1024) {
    throw new Error('Invalid length');
  }
  const result = new Uint8Array(length);
  window.crypto.getRandomValues(result);
  return result;
}

exports.randomBytes = randomBytes;

function createHmac(_algo, key) {
  const supportedAlgorithms = {
    sha256: sha256_1.sha256,
    sha512: sha512_1.sha512,
  };
  const algo = supportedAlgorithms[_algo];
  if (!algo) {
    throw new Error('Invalid hmac algorithm');
  }
  return hmac_1.hmac.create(algo, key);
}

exports.createHmac = createHmac;
