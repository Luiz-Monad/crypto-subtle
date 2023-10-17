import 'module';

var sjcl = global.sjcl;
sjcl.hash.sha256 = function (hash) {
  if (!this._key[0]) {
    this._precompute();
  }
  if (hash) {
    this._h = hash._h.slice(0);
    this._buffer = hash._buffer.slice(0);
    this._length = hash._length;
  } else {
    this.reset();
  }
};
sjcl.hash.sha256.hash = function (data) {
  return new sjcl.hash.sha256().update(data).finalize();
};
sjcl.hash.sha256.prototype = {
  blockSize: 512,
  reset: function () {
    this._h = this._init.slice(0);
    this._buffer = [];
    this._length = 0;
    return this;
  },
  update: function (data) {
    if (typeof data === "string") {
      data = sjcl.codec.utf8String.toBits(data);
    }
    var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl.bitArray.bitLength(data);
    if (nl > 9007199254740991) {
      throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
    }
    if (typeof Uint32Array !== "undefined") {
      var c = new Uint32Array(b);
      var j = 0;
      for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
        this._block(c.subarray(16 * j, 16 * (j + 1)));
        j += 1;
      }
      b.splice(0, 16 * j);
    } else {
      for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
        this._block(b.splice(0, 16));
      }
    }
    return this;
  },
  finalize: function () {
    var i, b = this._buffer, h = this._h;
    b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
    for (i = b.length + 2; i & 15; i++) {
      b.push(0);
    }
    b.push(Math.floor(this._length / 4294967296));
    b.push(this._length | 0);
    while (b.length) {
      this._block(b.splice(0, 16));
    }
    this.reset();
    return h;
  },
  _init: [],
  _key: [],
  _precompute: function () {
    var i = 0, prime = 2, factor, isPrime;
    function frac(x) {
      return (x - Math.floor(x)) * 4294967296 | 0;
    }
    for (; i < 64; prime++) {
      isPrime = true;
      for (factor = 2; factor * factor <= prime; factor++) {
        if (prime % factor === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        if (i < 8) {
          this._init[i] = frac(Math.pow(prime, 1 / 2));
        }
        this._key[i] = frac(Math.pow(prime, 1 / 3));
        i++;
      }
    }
  },
  _block: function (w) {
    var i, tmp, a, b, h = this._h, k = this._key, h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3], h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];
    for (i = 0; i < 64; i++) {
      if (i < 16) {
        tmp = w[i];
      } else {
        a = w[i + 1 & 15];
        b = w[i + 14 & 15];
        tmp = w[i & 15] = (a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) + (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) + w[i & 15] + w[i + 9 & 15] | 0;
      }
      tmp = tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6)) + k[i];
      h7 = h6;
      h6 = h5;
      h5 = h4;
      h4 = h3 + tmp | 0;
      h3 = h2;
      h2 = h1;
      h1 = h0;
      h0 = tmp + (h1 & h2 ^ h3 & (h1 ^ h2)) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1 << 10) | 0;
    }
    h[0] = h[0] + h0 | 0;
    h[1] = h[1] + h1 | 0;
    h[2] = h[2] + h2 | 0;
    h[3] = h[3] + h3 | 0;
    h[4] = h[4] + h4 | 0;
    h[5] = h[5] + h5 | 0;
    h[6] = h[6] + h6 | 0;
    h[7] = h[7] + h7 | 0;
  }
};

export { sjcl as default };
