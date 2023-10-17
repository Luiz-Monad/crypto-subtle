import 'module';

var sjcl = global.sjcl;
sjcl.hash.sha512 = function (hash) {
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
sjcl.hash.sha512.hash = function (data) {
  return new sjcl.hash.sha512().update(data).finalize();
};
sjcl.hash.sha512.prototype = {
  blockSize: 1024,
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
      for (i = 1024 + ol - (1024 + ol & 1023); i <= nl; i += 1024) {
        this._block(c.subarray(32 * j, 32 * (j + 1)));
        j += 1;
      }
      b.splice(0, 32 * j);
    } else {
      for (i = 1024 + ol - (1024 + ol & 1023); i <= nl; i += 1024) {
        this._block(b.splice(0, 32));
      }
    }
    return this;
  },
  finalize: function () {
    var i, b = this._buffer, h = this._h;
    b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
    for (i = b.length + 4; i & 31; i++) {
      b.push(0);
    }
    b.push(0);
    b.push(0);
    b.push(Math.floor(this._length / 4294967296));
    b.push(this._length | 0);
    while (b.length) {
      this._block(b.splice(0, 32));
    }
    this.reset();
    return h;
  },
  _init: [],
  _initr: [12372232, 13281083, 9762859, 1914609, 15106769, 4090911, 4308331, 8266105],
  _key: [],
  _keyr: [2666018, 15689165, 5061423, 9034684, 4764984, 380953, 1658779, 7176472, 197186, 7368638, 14987916, 16757986, 8096111, 1480369, 13046325, 6891156, 15813330, 5187043, 9229749, 11312229, 2818677, 10937475, 4324308, 1135541, 6741931, 11809296, 16458047, 15666916, 11046850, 698149, 229999, 945776, 13774844, 2541862, 12856045, 9810911, 11494366, 7844520, 15576806, 8533307, 15795044, 4337665, 16291729, 5553712, 15684120, 6662416, 7413802, 12308920, 13816008, 4303699, 9366425, 10176680, 13195875, 4295371, 6546291, 11712675, 15708924, 1519456, 15772530, 6568428, 6495784, 8568297, 13007125, 7492395, 2515356, 12632583, 14740254, 7262584, 1535930, 13146278, 16321966, 1853211, 294276, 13051027, 13221564, 1051980, 4080310, 6651434, 14088940, 4675607],
  _precompute: function () {
    var i = 0, prime = 2, factor, isPrime;
    function frac(x) {
      return (x - Math.floor(x)) * 4294967296 | 0;
    }
    function frac2(x) {
      return (x - Math.floor(x)) * 1099511627776 & 255;
    }
    for (; i < 80; prime++) {
      isPrime = true;
      for (factor = 2; factor * factor <= prime; factor++) {
        if (prime % factor === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        if (i < 8) {
          this._init[i * 2] = frac(Math.pow(prime, 1 / 2));
          this._init[i * 2 + 1] = frac2(Math.pow(prime, 1 / 2)) << 24 | this._initr[i];
        }
        this._key[i * 2] = frac(Math.pow(prime, 1 / 3));
        this._key[i * 2 + 1] = frac2(Math.pow(prime, 1 / 3)) << 24 | this._keyr[i];
        i++;
      }
    }
  },
  _block: function (words) {
    var i, wrh, wrl, h = this._h, k = this._key, h0h = h[0], h0l = h[1], h1h = h[2], h1l = h[3], h2h = h[4], h2l = h[5], h3h = h[6], h3l = h[7], h4h = h[8], h4l = h[9], h5h = h[10], h5l = h[11], h6h = h[12], h6l = h[13], h7h = h[14], h7l = h[15];
    var w;
    if (typeof Uint32Array !== "undefined") {
      w = Array(160);
      for (var j = 0; j < 32; j++) {
        w[j] = words[j];
      }
    } else {
      w = words;
    }
    var ah = h0h, al = h0l, bh = h1h, bl = h1l, ch = h2h, cl = h2l, dh = h3h, dl = h3l, eh = h4h, el = h4l, fh = h5h, fl = h5l, gh = h6h, gl = h6l, hh = h7h, hl = h7l;
    for (i = 0; i < 80; i++) {
      if (i < 16) {
        wrh = w[i * 2];
        wrl = w[i * 2 + 1];
      } else {
        var gamma0xh = w[(i - 15) * 2];
        var gamma0xl = w[(i - 15) * 2 + 1];
        var gamma0h = (gamma0xl << 31 | gamma0xh >>> 1) ^ (gamma0xl << 24 | gamma0xh >>> 8) ^ gamma0xh >>> 7;
        var gamma0l = (gamma0xh << 31 | gamma0xl >>> 1) ^ (gamma0xh << 24 | gamma0xl >>> 8) ^ (gamma0xh << 25 | gamma0xl >>> 7);
        var gamma1xh = w[(i - 2) * 2];
        var gamma1xl = w[(i - 2) * 2 + 1];
        var gamma1h = (gamma1xl << 13 | gamma1xh >>> 19) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
        var gamma1l = (gamma1xh << 13 | gamma1xl >>> 19) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xh << 26 | gamma1xl >>> 6);
        var wr7h = w[(i - 7) * 2];
        var wr7l = w[(i - 7) * 2 + 1];
        var wr16h = w[(i - 16) * 2];
        var wr16l = w[(i - 16) * 2 + 1];
        wrl = gamma0l + wr7l;
        wrh = gamma0h + wr7h + (wrl >>> 0 < gamma0l >>> 0 ? 1 : 0);
        wrl += gamma1l;
        wrh += gamma1h + (wrl >>> 0 < gamma1l >>> 0 ? 1 : 0);
        wrl += wr16l;
        wrh += wr16h + (wrl >>> 0 < wr16l >>> 0 ? 1 : 0);
      }
      w[i * 2] = wrh |= 0;
      w[i * 2 + 1] = wrl |= 0;
      var chh = eh & fh ^ ~eh & gh;
      var chl = el & fl ^ ~el & gl;
      var majh = ah & bh ^ ah & ch ^ bh & ch;
      var majl = al & bl ^ al & cl ^ bl & cl;
      var sigma0h = (al << 4 | ah >>> 28) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
      var sigma0l = (ah << 4 | al >>> 28) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
      var sigma1h = (el << 18 | eh >>> 14) ^ (el << 14 | eh >>> 18) ^ (eh << 23 | el >>> 9);
      var sigma1l = (eh << 18 | el >>> 14) ^ (eh << 14 | el >>> 18) ^ (el << 23 | eh >>> 9);
      var krh = k[i * 2];
      var krl = k[i * 2 + 1];
      var t1l = hl + sigma1l;
      var t1h = hh + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
      t1l += chl;
      t1h += chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
      t1l += krl;
      t1h += krh + (t1l >>> 0 < krl >>> 0 ? 1 : 0);
      t1l = t1l + wrl | 0;
      t1h += wrh + (t1l >>> 0 < wrl >>> 0 ? 1 : 0);
      var t2l = sigma0l + majl;
      var t2h = sigma0h + majh + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
      hh = gh;
      hl = gl;
      gh = fh;
      gl = fl;
      fh = eh;
      fl = el;
      el = dl + t1l | 0;
      eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dh = ch;
      dl = cl;
      ch = bh;
      cl = bl;
      bh = ah;
      bl = al;
      al = t1l + t2l | 0;
      ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
    }
    h0l = h[1] = h0l + al | 0;
    h[0] = h0h + ah + (h0l >>> 0 < al >>> 0 ? 1 : 0) | 0;
    h1l = h[3] = h1l + bl | 0;
    h[2] = h1h + bh + (h1l >>> 0 < bl >>> 0 ? 1 : 0) | 0;
    h2l = h[5] = h2l + cl | 0;
    h[4] = h2h + ch + (h2l >>> 0 < cl >>> 0 ? 1 : 0) | 0;
    h3l = h[7] = h3l + dl | 0;
    h[6] = h3h + dh + (h3l >>> 0 < dl >>> 0 ? 1 : 0) | 0;
    h4l = h[9] = h4l + el | 0;
    h[8] = h4h + eh + (h4l >>> 0 < el >>> 0 ? 1 : 0) | 0;
    h5l = h[11] = h5l + fl | 0;
    h[10] = h5h + fh + (h5l >>> 0 < fl >>> 0 ? 1 : 0) | 0;
    h6l = h[13] = h6l + gl | 0;
    h[12] = h6h + gh + (h6l >>> 0 < gl >>> 0 ? 1 : 0) | 0;
    h7l = h[15] = h7l + hl | 0;
    h[14] = h7h + hh + (h7l >>> 0 < hl >>> 0 ? 1 : 0) | 0;
  }
};

export { sjcl as default };
