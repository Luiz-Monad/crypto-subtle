import 'module';

var sjcl = global.sjcl;
sjcl.bn = function (it) {
  this.initWith(it);
};
sjcl.bn.prototype = {
  radix: 24,
  maxMul: 8,
  _class: sjcl.bn,
  copy: function () {
    return new this._class(this);
  },
  initWith: function (it) {
    var i = 0, k;
    switch (typeof it) {
      case "object":
        this.limbs = it.limbs.slice(0);
        break;
      case "number":
        this.limbs = [it];
        this.normalize();
        break;
      case "string":
        it = it.replace(/^0x/, "");
        this.limbs = [];
        k = this.radix / 4;
        for (i = 0; i < it.length; i += k) {
          this.limbs.push(parseInt(it.substring(Math.max(it.length - i - k, 0), it.length - i), 16));
        }
        break;
      default:
        this.limbs = [0];
    }
    return this;
  },
  equals: function (that) {
    if (typeof that === "number") {
      that = new this._class(that);
    }
    var difference = 0, i;
    this.fullReduce();
    that.fullReduce();
    for (i = 0; i < this.limbs.length || i < that.limbs.length; i++) {
      difference |= this.getLimb(i) ^ that.getLimb(i);
    }
    return difference === 0;
  },
  getLimb: function (i) {
    return i >= this.limbs.length ? 0 : this.limbs[i];
  },
  greaterEquals: function (that) {
    if (typeof that === "number") {
      that = new this._class(that);
    }
    var less = 0, greater = 0, i, a, b;
    i = Math.max(this.limbs.length, that.limbs.length) - 1;
    for (; i >= 0; i--) {
      a = this.getLimb(i);
      b = that.getLimb(i);
      greater |= b - a & ~less;
      less |= a - b & ~greater;
    }
    return (greater | ~less) >>> 31;
  },
  toString: function () {
    this.fullReduce();
    var out = "", i, s, l = this.limbs;
    for (i = 0; i < this.limbs.length; i++) {
      s = l[i].toString(16);
      while (i < this.limbs.length - 1 && s.length < 6) {
        s = "0" + s;
      }
      out = s + out;
    }
    return "0x" + out;
  },
  addM: function (that) {
    if (typeof that !== "object") {
      that = new this._class(that);
    }
    var i, l = this.limbs, ll = that.limbs;
    for (i = l.length; i < ll.length; i++) {
      l[i] = 0;
    }
    for (i = 0; i < ll.length; i++) {
      l[i] += ll[i];
    }
    return this;
  },
  doubleM: function () {
    var i, carry = 0, tmp, r = this.radix, m = this.radixMask, l = this.limbs;
    for (i = 0; i < l.length; i++) {
      tmp = l[i];
      tmp = tmp + tmp + carry;
      l[i] = tmp & m;
      carry = tmp >> r;
    }
    if (carry) {
      l.push(carry);
    }
    return this;
  },
  halveM: function () {
    var i, carry = 0, tmp, r = this.radix, l = this.limbs;
    for (i = l.length - 1; i >= 0; i--) {
      tmp = l[i];
      l[i] = tmp + carry >> 1;
      carry = (tmp & 1) << r;
    }
    if (!l[l.length - 1]) {
      l.pop();
    }
    return this;
  },
  subM: function (that) {
    if (typeof that !== "object") {
      that = new this._class(that);
    }
    var i, l = this.limbs, ll = that.limbs;
    for (i = l.length; i < ll.length; i++) {
      l[i] = 0;
    }
    for (i = 0; i < ll.length; i++) {
      l[i] -= ll[i];
    }
    return this;
  },
  mod: function (that) {
    var neg = !this.greaterEquals(new sjcl.bn(0));
    that = new sjcl.bn(that).normalize();
    var out = new sjcl.bn(this).normalize(), ci = 0;
    if (neg) out = new sjcl.bn(0).subM(out).normalize();
    for (; out.greaterEquals(that); ci++) {
      that.doubleM();
    }
    if (neg) out = that.sub(out).normalize();
    for (; ci > 0; ci--) {
      that.halveM();
      if (out.greaterEquals(that)) {
        out.subM(that).normalize();
      }
    }
    return out.trim();
  },
  inverseMod: function (p) {
    var a = new sjcl.bn(1), b = new sjcl.bn(0), x = new sjcl.bn(this), y = new sjcl.bn(p), tmp, i, nz = 1;
    if (!(p.limbs[0] & 1)) {
      throw new sjcl.exception.invalid("inverseMod: p must be odd");
    }
    do {
      if (x.limbs[0] & 1) {
        if (!x.greaterEquals(y)) {
          tmp = x;
          x = y;
          y = tmp;
          tmp = a;
          a = b;
          b = tmp;
        }
        x.subM(y);
        x.normalize();
        if (!a.greaterEquals(b)) {
          a.addM(p);
        }
        a.subM(b);
      }
      x.halveM();
      if (a.limbs[0] & 1) {
        a.addM(p);
      }
      a.normalize();
      a.halveM();
      for (i = nz = 0; i < x.limbs.length; i++) {
        nz |= x.limbs[i];
      }
    } while (nz);
    if (!y.equals(1)) {
      throw new sjcl.exception.invalid("inverseMod: p and x must be relatively prime");
    }
    return b;
  },
  add: function (that) {
    return this.copy().addM(that);
  },
  sub: function (that) {
    return this.copy().subM(that);
  },
  mul: function (that) {
    if (typeof that === "number") {
      that = new this._class(that);
    } else {
      that.normalize();
    }
    this.normalize();
    var i, j, a = this.limbs, b = that.limbs, al = a.length, bl = b.length, out = new this._class(), c = out.limbs, ai, ii = this.maxMul;
    for (i = 0; i < this.limbs.length + that.limbs.length + 1; i++) {
      c[i] = 0;
    }
    for (i = 0; i < al; i++) {
      ai = a[i];
      for (j = 0; j < bl; j++) {
        c[i + j] += ai * b[j];
      }
      if (!--ii) {
        ii = this.maxMul;
        out.cnormalize();
      }
    }
    return out.cnormalize().reduce();
  },
  square: function () {
    return this.mul(this);
  },
  power: function (l) {
    l = new sjcl.bn(l).normalize().trim().limbs;
    var i, j, out = new this._class(1), pow = this;
    for (i = 0; i < l.length; i++) {
      for (j = 0; j < this.radix; j++) {
        if (l[i] & 1 << j) {
          out = out.mul(pow);
        }
        if (i == l.length - 1 && l[i] >> j + 1 == 0) {
          break;
        }
        pow = pow.square();
      }
    }
    return out;
  },
  mulmod: function (that, N) {
    return this.mod(N).mul(that.mod(N)).mod(N);
  },
  powermod: function (x, N) {
    x = new sjcl.bn(x);
    N = new sjcl.bn(N);
    if ((N.limbs[0] & 1) == 1) {
      var montOut = this.montpowermod(x, N);
      if (montOut != false) {
        return montOut;
      }
    }
    var i, j, l = x.normalize().trim().limbs, out = new this._class(1), pow = this;
    for (i = 0; i < l.length; i++) {
      for (j = 0; j < this.radix; j++) {
        if (l[i] & 1 << j) {
          out = out.mulmod(pow, N);
        }
        if (i == l.length - 1 && l[i] >> j + 1 == 0) {
          break;
        }
        pow = pow.mulmod(pow, N);
      }
    }
    return out;
  },
  montpowermod: function (x, N) {
    x = new sjcl.bn(x).normalize().trim();
    N = new sjcl.bn(N);
    var i, j, radix = this.radix, out = new this._class(1), pow = this.copy();
    var R, s, wind, bitsize = x.bitLength();
    R = new sjcl.bn({
      limbs: N.copy().normalize().trim().limbs.map(function () {
        return 0;
      })
    });
    for (s = this.radix; s > 0; s--) {
      if ((N.limbs[N.limbs.length - 1] >> s & 1) == 1) {
        R.limbs[R.limbs.length - 1] = 1 << s;
        break;
      }
    }
    if (bitsize == 0) {
      return this;
    } else if (bitsize < 18) {
      wind = 1;
    } else if (bitsize < 48) {
      wind = 3;
    } else if (bitsize < 144) {
      wind = 4;
    } else if (bitsize < 768) {
      wind = 5;
    } else {
      wind = 6;
    }
    var RR = R.copy(), NN = N.copy(), RP = new sjcl.bn(1), NP = new sjcl.bn(0), RT = R.copy();
    while (RT.greaterEquals(1)) {
      RT.halveM();
      if ((RP.limbs[0] & 1) == 0) {
        RP.halveM();
        NP.halveM();
      } else {
        RP.addM(NN);
        RP.halveM();
        NP.halveM();
        NP.addM(RR);
      }
    }
    RP = RP.normalize();
    NP = NP.normalize();
    RR.doubleM();
    var R2 = RR.mulmod(RR, N);
    if (!RR.mul(RP).sub(N.mul(NP)).equals(1)) {
      return false;
    }
    var montIn = function (c) {
      return montMul(c, R2);
    }, montMul = function (a, b) {
      var k, ab, right, abBar, mask = (1 << s + 1) - 1;
      ab = a.mul(b);
      right = ab.mul(NP);
      right.limbs = right.limbs.slice(0, R.limbs.length);
      if (right.limbs.length == R.limbs.length) {
        right.limbs[R.limbs.length - 1] &= mask;
      }
      right = right.mul(N);
      abBar = ab.add(right).normalize().trim();
      abBar.limbs = abBar.limbs.slice(R.limbs.length - 1);
      for (k = 0; k < abBar.limbs.length; k++) {
        if (k > 0) {
          abBar.limbs[k - 1] |= (abBar.limbs[k] & mask) << radix - s - 1;
        }
        abBar.limbs[k] = abBar.limbs[k] >> s + 1;
      }
      if (abBar.greaterEquals(N)) {
        abBar.subM(N);
      }
      return abBar;
    }, montOut = function (c) {
      return montMul(c, 1);
    };
    pow = montIn(pow);
    out = montIn(out);
    var h, precomp = {}, cap = (1 << wind - 1) - 1;
    precomp[1] = pow.copy();
    precomp[2] = montMul(pow, pow);
    for (h = 1; h <= cap; h++) {
      precomp[2 * h + 1] = montMul(precomp[2 * h - 1], precomp[2]);
    }
    var getBit = function (exp, i) {
      var off = i % exp.radix;
      return (exp.limbs[Math.floor(i / exp.radix)] & 1 << off) >> off;
    };
    for (i = x.bitLength() - 1; i >= 0; ) {
      if (getBit(x, i) == 0) {
        out = montMul(out, out);
        i = i - 1;
      } else {
        var l = i - wind + 1;
        while (getBit(x, l) == 0) {
          l++;
        }
        var indx = 0;
        for (j = l; j <= i; j++) {
          indx += getBit(x, j) << j - l;
          out = montMul(out, out);
        }
        out = montMul(out, precomp[indx]);
        i = l - 1;
      }
    }
    return montOut(out);
  },
  trim: function () {
    var l = this.limbs, p;
    do {
      p = l.pop();
    } while (l.length && p === 0);
    l.push(p);
    return this;
  },
  reduce: function () {
    return this;
  },
  fullReduce: function () {
    return this.normalize();
  },
  normalize: function () {
    var carry = 0, i, pv = this.placeVal, ipv = this.ipv, l, m, limbs = this.limbs, ll = limbs.length, mask = this.radixMask;
    for (i = 0; i < ll || carry !== 0 && carry !== -1; i++) {
      l = (limbs[i] || 0) + carry;
      m = limbs[i] = l & mask;
      carry = (l - m) * ipv;
    }
    if (carry === -1) {
      limbs[i - 1] -= pv;
    }
    this.trim();
    return this;
  },
  cnormalize: function () {
    var carry = 0, i, ipv = this.ipv, l, m, limbs = this.limbs, ll = limbs.length, mask = this.radixMask;
    for (i = 0; i < ll - 1; i++) {
      l = limbs[i] + carry;
      m = limbs[i] = l & mask;
      carry = (l - m) * ipv;
    }
    limbs[i] += carry;
    return this;
  },
  toBits: function (len) {
    this.fullReduce();
    len = len || this.exponent || this.bitLength();
    var i = Math.floor((len - 1) / 24), w = sjcl.bitArray, e = (len + 7 & -8) % this.radix || this.radix, out = [w.partial(e, this.getLimb(i))];
    for (i--; i >= 0; i--) {
      out = w.concat(out, [w.partial(Math.min(this.radix, len), this.getLimb(i))]);
      len -= this.radix;
    }
    return out;
  },
  bitLength: function () {
    this.fullReduce();
    var out = this.radix * (this.limbs.length - 1), b = this.limbs[this.limbs.length - 1];
    for (; b; b >>>= 1) {
      out++;
    }
    return out + 7 & -8;
  }
};
sjcl.bn.fromBits = function (bits) {
  var Class = this, out = new Class(), words = [], w = sjcl.bitArray, t = this.prototype, l = Math.min(this.bitLength || 4294967296, w.bitLength(bits)), e = l % t.radix || t.radix;
  words[0] = w.extract(bits, 0, e);
  for (; e < l; e += t.radix) {
    words.unshift(w.extract(bits, e, t.radix));
  }
  out.limbs = words;
  return out;
};
sjcl.bn.prototype.ipv = 1 / (sjcl.bn.prototype.placeVal = Math.pow(2, sjcl.bn.prototype.radix));
sjcl.bn.prototype.radixMask = (1 << sjcl.bn.prototype.radix) - 1;
sjcl.bn.pseudoMersennePrime = function (exponent, coeff) {
  function p(it) {
    this.initWith(it);
  }
  var ppr = p.prototype = new sjcl.bn(), i, tmp, mo;
  mo = ppr.modOffset = Math.ceil(tmp = exponent / ppr.radix);
  ppr.exponent = exponent;
  ppr.offset = [];
  ppr.factor = [];
  ppr.minOffset = mo;
  ppr.fullMask = 0;
  ppr.fullOffset = [];
  ppr.fullFactor = [];
  ppr.modulus = p.modulus = new sjcl.bn(Math.pow(2, exponent));
  ppr.fullMask = 0 | -Math.pow(2, exponent % ppr.radix);
  for (i = 0; i < coeff.length; i++) {
    ppr.offset[i] = Math.floor(coeff[i][0] / ppr.radix - tmp);
    ppr.fullOffset[i] = Math.floor(coeff[i][0] / ppr.radix) - mo + 1;
    ppr.factor[i] = coeff[i][1] * Math.pow(1 / 2, exponent - coeff[i][0] + ppr.offset[i] * ppr.radix);
    ppr.fullFactor[i] = coeff[i][1] * Math.pow(1 / 2, exponent - coeff[i][0] + ppr.fullOffset[i] * ppr.radix);
    ppr.modulus.addM(new sjcl.bn(Math.pow(2, coeff[i][0]) * coeff[i][1]));
    ppr.minOffset = Math.min(ppr.minOffset, -ppr.offset[i]);
  }
  ppr._class = p;
  ppr.modulus.cnormalize();
  ppr.reduce = function () {
    var i, k, l, mo = this.modOffset, limbs = this.limbs, off = this.offset, ol = this.offset.length, fac = this.factor, ll;
    i = this.minOffset;
    while (limbs.length > mo) {
      l = limbs.pop();
      ll = limbs.length;
      for (k = 0; k < ol; k++) {
        limbs[ll + off[k]] -= fac[k] * l;
      }
      i--;
      if (!i) {
        limbs.push(0);
        this.cnormalize();
        i = this.minOffset;
      }
    }
    this.cnormalize();
    return this;
  };
  ppr._strongReduce = ppr.fullMask === -1 ? ppr.reduce : function () {
    var limbs = this.limbs, i = limbs.length - 1, k, l;
    this.reduce();
    if (i === this.modOffset - 1) {
      l = limbs[i] & this.fullMask;
      limbs[i] -= l;
      for (k = 0; k < this.fullOffset.length; k++) {
        limbs[i + this.fullOffset[k]] -= this.fullFactor[k] * l;
      }
      this.normalize();
    }
  };
  ppr.fullReduce = function () {
    var greater, i;
    this._strongReduce();
    this.addM(this.modulus);
    this.addM(this.modulus);
    this.normalize();
    this._strongReduce();
    for (i = this.limbs.length; i < this.modOffset; i++) {
      this.limbs[i] = 0;
    }
    greater = this.greaterEquals(this.modulus);
    for (i = 0; i < this.limbs.length; i++) {
      this.limbs[i] -= this.modulus.limbs[i] * greater;
    }
    this.cnormalize();
    return this;
  };
  ppr.inverse = function () {
    return this.power(this.modulus.sub(2));
  };
  p.fromBits = sjcl.bn.fromBits;
  return p;
};
var sbp = sjcl.bn.pseudoMersennePrime;
sjcl.bn.prime = {
  p127: sbp(127, [[0, -1]]),
  p25519: sbp(255, [[0, -19]]),
  p192k: sbp(192, [[32, -1], [12, -1], [8, -1], [7, -1], [6, -1], [3, -1], [0, -1]]),
  p224k: sbp(224, [[32, -1], [12, -1], [11, -1], [9, -1], [7, -1], [4, -1], [1, -1], [0, -1]]),
  p256k: sbp(256, [[32, -1], [9, -1], [8, -1], [7, -1], [6, -1], [4, -1], [0, -1]]),
  p192: sbp(192, [[0, -1], [64, -1]]),
  p224: sbp(224, [[0, 1], [96, -1]]),
  p256: sbp(256, [[0, -1], [96, 1], [192, 1], [224, -1]]),
  p384: sbp(384, [[0, -1], [32, 1], [96, -1], [128, -1]]),
  p521: sbp(521, [[0, -1]])
};
sjcl.bn.random = function (modulus, paranoia) {
  if (typeof modulus !== "object") {
    modulus = new sjcl.bn(modulus);
  }
  var words, i, l = modulus.limbs.length, m = modulus.limbs[l - 1] + 1, out = new sjcl.bn();
  while (true) {
    do {
      words = sjcl.random.randomWords(l, paranoia);
      if (words[l - 1] < 0) {
        words[l - 1] += 4294967296;
      }
    } while (Math.floor(words[l - 1] / m) === Math.floor(4294967296 / m));
    words[l - 1] %= m;
    for (i = 0; i < l - 1; i++) {
      words[i] &= modulus.radixMask;
    }
    out.limbs = words;
    if (!out.greaterEquals(modulus)) {
      return out;
    }
  }
};

export { sjcl as default };
