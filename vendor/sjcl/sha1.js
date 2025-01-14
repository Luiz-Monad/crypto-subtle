"use strict";

var sjcl = require("./sjcl");
var hash = module.exports = sjcl.hash = sjcl.hash || {};
var codec = sjcl.codec;
var bitArray = sjcl.bitArray;
/** @fileOverview Javascript SHA-1 implementation.
 *
 * Based on the implementation in RFC 3174, method 1, and on the SJCL
 * SHA-256 implementation.
 *
 * @author Quinn Slack
 */

/**
 * Context for a SHA-1 operation in progress.
 * @constructor
 */
hash.sha1 = function (hash) {
  if (hash) {
    this._h = hash._h.slice(0);
    this._buffer = hash._buffer.slice(0);
    this._length = hash._length;
  } else {
    this.reset();
  }
};

/**
 * Hash a string or an array of words.
 * @static
 * @param {bitArray|String} data the data to hash.
 * @return {bitArray} The hash value, an array of 5 big-endian words.
 */
hash.sha1.hash = function (data) {
  return new sjcl.hash.sha1().update(data).finalize();
};
hash.sha1.prototype = {
  /**
   * The hash's block size, in bits.
   * @constant
   */
  blockSize: 512,
  /**
   * Reset the hash state.
   * @return this
   */
  reset: function () {
    this._h = this._init.slice(0);
    this._buffer = [];
    this._length = 0;
    return this;
  },
  /**
   * Input several words to the hash.
   * @param {bitArray|String} data the data to hash.
   * @return this
   */
  update: function (data) {
    if (typeof data === "string") {
      data = codec.utf8String.toBits(data);
    }
    var i,
      b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
      ol = this._length,
      nl = this._length = ol + sjcl.bitArray.bitLength(data);
    if (nl > 9007199254740991) {
      throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
    }
    if (typeof Uint32Array !== 'undefined') {
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
  /**
   * Complete hashing and output the hash value.
   * @return {bitArray} The hash value, an array of 5 big-endian words. TODO
   */
  finalize: function () {
    var i,
      b = this._buffer,
      h = this._h;

    // Round out and push the buffer
    b = bitArray.concat(b, [bitArray.partial(1, 1)]);
    // Round out the buffer to a multiple of 16 words, less the 2 length words.
    for (i = b.length + 2; i & 15; i++) {
      b.push(0);
    }

    // append the length
    b.push(Math.floor(this._length / 0x100000000));
    b.push(this._length | 0);
    while (b.length) {
      this._block(b.splice(0, 16));
    }
    this.reset();
    return h;
  },
  /**
   * The SHA-1 initialization vector.
   * @private
   */
  _init: [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],
  /**
   * The SHA-1 hash key.
   * @private
   */
  _key: [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6],
  /**
   * The SHA-1 logical functions f(0), f(1), ..., f(79).
   * @private
   */
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
  /**
   * Circular left-shift operator.
   * @private
   */
  _S: function (n, x) {
    return x << n | x >>> 32 - n;
  },
  /**
   * Perform one cycle of SHA-1.
   * @param {Uint32Array|bitArray} words one block of words.
   * @private
   */
  _block: function (words) {
    var t,
      tmp,
      a,
      b,
      c,
      d,
      e,
      h = this._h;
    var w;
    if (typeof Uint32Array !== 'undefined') {
      // When words is passed to _block, it has 16 elements. SHA1 _block
      // function extends words with new elements (at the end there are 80 elements). 
      // The problem is that if we use Uint32Array instead of Array, 
      // the length of Uint32Array cannot be changed. Thus, we replace words with a 
      // normal Array here.
      w = Array(80); // do not use Uint32Array here as the instantiation is slower
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
