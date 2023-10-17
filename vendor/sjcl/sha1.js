import 'module';

var sjcl = global.sjcl;
sjcl.hash.sha1 = function (hash) {
  if (hash) {
    this._h = hash._h.slice(0);
    this._buffer = hash._buffer.slice(0);
    this._length = hash._length;
  } else {
    this.reset();
  }
};
sjcl.hash.sha1.hash = function (data) {
  return new sjcl.hash.sha1().update(data).finalize();
};
sjcl.hash.sha1.prototype = {
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
      for (i = this.blockSize + ol - (this.blockSize + ol & this.blockSize - 1); i <= nl; i += this.blockSize) {
        this._block(c.subarray(16 * j, 16 * (j + 1)));
        j += 1;
      }
      b.splice(0, 16 * j);
    } else {
      for (i = this.blockSize + ol - (this.blockSize + ol & this.blockSize - 1); i <= nl; i += this.blockSize) {
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
  _init: [1732584193, 4023233417, 2562383102, 271733878, 3285377520],
  _key: [1518500249, 1859775393, 2400959708, 3395469782],
  _f: function (t, b, c, d) {
    if (t <= 19) {
      return b & c | ~b & d;
    } else if (t <= 39) {
      return b ^ c ^ d;
    } else if (t <= 59) {
      return b & c | b & d | c & d;
    } else if (t <= 79) {
      return b ^ c ^ d;
    }
  },
  _S: function (n, x) {
    return x << n | x >>> 32 - n;
  },
  _block: function (words) {
    var t, tmp, a, b, c, d, e, h = this._h;
    var w;
    if (typeof Uint32Array !== "undefined") {
      w = Array(80);
      for (var j = 0; j < 16; j++) {
        w[j] = words[j];
      }
    } else {
      w = words;
    }
    a = h[0];
    b = h[1];
    c = h[2];
    d = h[3];
    e = h[4];
    for (t = 0; t <= 79; t++) {
      if (t >= 16) {
        w[t] = this._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
      }
      tmp = this._S(5, a) + this._f(t, b, c, d) + e + w[t] + this._key[Math.floor(t / 20)] | 0;
      e = d;
      d = c;
      c = this._S(30, b);
      b = a;
      a = tmp;
    }
    h[0] = h[0] + a | 0;
    h[1] = h[1] + b | 0;
    h[2] = h[2] + c | 0;
    h[3] = h[3] + d | 0;
    h[4] = h[4] + e | 0;
  }
};

export { sjcl as default };
