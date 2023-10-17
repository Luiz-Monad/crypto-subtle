import 'module';
import './util.js';

var forge = global.forge;
var sha512 = forge.sha512 = forge.sha512 || ({});
forge.md = forge.md || ({});
forge.md.algorithms = forge.md.algorithms || ({});
forge.md.sha512 = forge.md.algorithms.sha512 = sha512;
var sha384 = forge.sha384 = forge.sha512.sha384 = forge.sha512.sha384 || ({});
sha384.create = function () {
  return sha512.create("SHA-384");
};
forge.md.sha384 = forge.md.algorithms.sha384 = sha384;
forge.sha512.sha256 = forge.sha512.sha256 || ({
  create: function () {
    return sha512.create("SHA-512/256");
  }
});
forge.md["sha512/256"] = forge.md.algorithms["sha512/256"] = forge.sha512.sha256;
forge.sha512.sha224 = forge.sha512.sha224 || ({
  create: function () {
    return sha512.create("SHA-512/224");
  }
});
forge.md["sha512/224"] = forge.md.algorithms["sha512/224"] = forge.sha512.sha224;
sha512.create = function (algorithm) {
  if (!_initialized) {
    _init();
  }
  if (typeof algorithm === "undefined") {
    algorithm = "SHA-512";
  }
  if (!((algorithm in _states))) {
    throw new Error("Invalid SHA-512 algorithm: " + algorithm);
  }
  var _state = _states[algorithm];
  var _h = null;
  var _input = forge.util.createBuffer();
  var _w = new Array(80);
  for (var wi = 0; wi < 80; ++wi) {
    _w[wi] = new Array(2);
  }
  var md = {
    algorithm: algorithm.replace("-", "").toLowerCase(),
    blockLength: 128,
    digestLength: 64,
    messageLength: 0,
    fullMessageLength: null,
    messageLengthSize: 16
  };
  md.start = function () {
    md.messageLength = 0;
    md.fullMessageLength = md.messageLength128 = [];
    var int32s = md.messageLengthSize / 4;
    for (var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = forge.util.createBuffer();
    _h = new Array(_state.length);
    for (var i = 0; i < _state.length; ++i) {
      _h[i] = _state[i].slice(0);
    }
    return md;
  };
  md.start();
  md.update = function (msg, encoding) {
    if (encoding === "utf8") {
      msg = forge.util.encodeUtf8(msg);
    }
    var len = msg.length;
    md.messageLength += len;
    len = [len / 4294967296 >>> 0, len >>> 0];
    for (var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + (md.fullMessageLength[i] / 4294967296 >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = len[1] / 4294967296 >>> 0;
    }
    _input.putBytes(msg);
    _update(_h, _w, _input);
    if (_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }
    return md;
  };
  md.digest = function () {
    var finalBlock = forge.util.createBuffer();
    finalBlock.putBytes(_input.bytes());
    var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
    var overflow = remaining & md.blockLength - 1;
    finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for (var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = next / 4294967296 >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);
    var h = new Array(_h.length);
    for (var i = 0; i < _h.length; ++i) {
      h[i] = _h[i].slice(0);
    }
    _update(h, _w, finalBlock);
    var rval = forge.util.createBuffer();
    var hlen;
    if (algorithm === "SHA-512") {
      hlen = h.length;
    } else if (algorithm === "SHA-384") {
      hlen = h.length - 2;
    } else {
      hlen = h.length - 4;
    }
    for (var i = 0; i < hlen; ++i) {
      rval.putInt32(h[i][0]);
      if (i !== hlen - 1 || algorithm !== "SHA-512/224") {
        rval.putInt32(h[i][1]);
      }
    }
    return rval;
  };
  return md;
};
var _padding = null;
var _initialized = false;
var _k = null;
var _states = null;
function _init() {
  _padding = String.fromCharCode(128);
  _padding += forge.util.fillString(String.fromCharCode(0), 128);
  _k = [[1116352408, 3609767458], [1899447441, 602891725], [3049323471, 3964484399], [3921009573, 2173295548], [961987163, 4081628472], [1508970993, 3053834265], [2453635748, 2937671579], [2870763221, 3664609560], [3624381080, 2734883394], [310598401, 1164996542], [607225278, 1323610764], [1426881987, 3590304994], [1925078388, 4068182383], [2162078206, 991336113], [2614888103, 633803317], [3248222580, 3479774868], [3835390401, 2666613458], [4022224774, 944711139], [264347078, 2341262773], [604807628, 2007800933], [770255983, 1495990901], [1249150122, 1856431235], [1555081692, 3175218132], [1996064986, 2198950837], [2554220882, 3999719339], [2821834349, 766784016], [2952996808, 2566594879], [3210313671, 3203337956], [3336571891, 1034457026], [3584528711, 2466948901], [113926993, 3758326383], [338241895, 168717936], [666307205, 1188179964], [773529912, 1546045734], [1294757372, 1522805485], [1396182291, 2643833823], [1695183700, 2343527390], [1986661051, 1014477480], [2177026350, 1206759142], [2456956037, 344077627], [2730485921, 1290863460], [2820302411, 3158454273], [3259730800, 3505952657], [3345764771, 106217008], [3516065817, 3606008344], [3600352804, 1432725776], [4094571909, 1467031594], [275423344, 851169720], [430227734, 3100823752], [506948616, 1363258195], [659060556, 3750685593], [883997877, 3785050280], [958139571, 3318307427], [1322822218, 3812723403], [1537002063, 2003034995], [1747873779, 3602036899], [1955562222, 1575990012], [2024104815, 1125592928], [2227730452, 2716904306], [2361852424, 442776044], [2428436474, 593698344], [2756734187, 3733110249], [3204031479, 2999351573], [3329325298, 3815920427], [3391569614, 3928383900], [3515267271, 566280711], [3940187606, 3454069534], [4118630271, 4000239992], [116418474, 1914138554], [174292421, 2731055270], [289380356, 3203993006], [460393269, 320620315], [685471733, 587496836], [852142971, 1086792851], [1017036298, 365543100], [1126000580, 2618297676], [1288033470, 3409855158], [1501505948, 4234509866], [1607167915, 987167468], [1816402316, 1246189591]];
  _states = {};
  _states["SHA-512"] = [[1779033703, 4089235720], [3144134277, 2227873595], [1013904242, 4271175723], [2773480762, 1595750129], [1359893119, 2917565137], [2600822924, 725511199], [528734635, 4215389547], [1541459225, 327033209]];
  _states["SHA-384"] = [[3418070365, 3238371032], [1654270250, 914150663], [2438529370, 812702999], [355462360, 4144912697], [1731405415, 4290775857], [2394180231, 1750603025], [3675008525, 1694076839], [1203062813, 3204075428]];
  _states["SHA-512/256"] = [[573645204, 4230739756], [2673172387, 3360449730], [596883563, 1867755857], [2520282905, 1497426621], [2519219938, 2827943907], [3193839141, 1401305490], [721525244, 746961066], [246885852, 2177182882]];
  _states["SHA-512/224"] = [[2352822216, 424955298], [1944164710, 2312950998], [502970286, 855612546], [1738396948, 1479516111], [258812777, 2077511080], [2011393907, 79989058], [1067287976, 1780299464], [286451373, 2446758561]];
  _initialized = true;
}
function _update(s, w, bytes) {
  var t1_hi, t1_lo;
  var t2_hi, t2_lo;
  var s0_hi, s0_lo;
  var s1_hi, s1_lo;
  var ch_hi, ch_lo;
  var maj_hi, maj_lo;
  var a_hi, a_lo;
  var b_hi, b_lo;
  var c_hi, c_lo;
  var d_hi, d_lo;
  var e_hi, e_lo;
  var f_hi, f_lo;
  var g_hi, g_lo;
  var h_hi, h_lo;
  var i, hi, lo, w2, w7, w15, w16;
  var len = bytes.length();
  while (len >= 128) {
    for (i = 0; i < 16; ++i) {
      w[i][0] = bytes.getInt32() >>> 0;
      w[i][1] = bytes.getInt32() >>> 0;
    }
    for (; i < 80; ++i) {
      w2 = w[i - 2];
      hi = w2[0];
      lo = w2[1];
      t1_hi = ((hi >>> 19 | lo << 13) ^ (lo >>> 29 | hi << 3) ^ hi >>> 6) >>> 0;
      t1_lo = ((hi << 13 | lo >>> 19) ^ (lo << 3 | hi >>> 29) ^ (hi << 26 | lo >>> 6)) >>> 0;
      w15 = w[i - 15];
      hi = w15[0];
      lo = w15[1];
      t2_hi = ((hi >>> 1 | lo << 31) ^ (hi >>> 8 | lo << 24) ^ hi >>> 7) >>> 0;
      t2_lo = ((hi << 31 | lo >>> 1) ^ (hi << 24 | lo >>> 8) ^ (hi << 25 | lo >>> 7)) >>> 0;
      w7 = w[i - 7];
      w16 = w[i - 16];
      lo = t1_lo + w7[1] + t2_lo + w16[1];
      w[i][0] = t1_hi + w7[0] + t2_hi + w16[0] + (lo / 4294967296 >>> 0) >>> 0;
      w[i][1] = lo >>> 0;
    }
    a_hi = s[0][0];
    a_lo = s[0][1];
    b_hi = s[1][0];
    b_lo = s[1][1];
    c_hi = s[2][0];
    c_lo = s[2][1];
    d_hi = s[3][0];
    d_lo = s[3][1];
    e_hi = s[4][0];
    e_lo = s[4][1];
    f_hi = s[5][0];
    f_lo = s[5][1];
    g_hi = s[6][0];
    g_lo = s[6][1];
    h_hi = s[7][0];
    h_lo = s[7][1];
    for (i = 0; i < 80; ++i) {
      s1_hi = ((e_hi >>> 14 | e_lo << 18) ^ (e_hi >>> 18 | e_lo << 14) ^ (e_lo >>> 9 | e_hi << 23)) >>> 0;
      s1_lo = ((e_hi << 18 | e_lo >>> 14) ^ (e_hi << 14 | e_lo >>> 18) ^ (e_lo << 23 | e_hi >>> 9)) >>> 0;
      ch_hi = (g_hi ^ e_hi & (f_hi ^ g_hi)) >>> 0;
      ch_lo = (g_lo ^ e_lo & (f_lo ^ g_lo)) >>> 0;
      s0_hi = ((a_hi >>> 28 | a_lo << 4) ^ (a_lo >>> 2 | a_hi << 30) ^ (a_lo >>> 7 | a_hi << 25)) >>> 0;
      s0_lo = ((a_hi << 4 | a_lo >>> 28) ^ (a_lo << 30 | a_hi >>> 2) ^ (a_lo << 25 | a_hi >>> 7)) >>> 0;
      maj_hi = (a_hi & b_hi | c_hi & (a_hi ^ b_hi)) >>> 0;
      maj_lo = (a_lo & b_lo | c_lo & (a_lo ^ b_lo)) >>> 0;
      lo = h_lo + s1_lo + ch_lo + _k[i][1] + w[i][1];
      t1_hi = h_hi + s1_hi + ch_hi + _k[i][0] + w[i][0] + (lo / 4294967296 >>> 0) >>> 0;
      t1_lo = lo >>> 0;
      lo = s0_lo + maj_lo;
      t2_hi = s0_hi + maj_hi + (lo / 4294967296 >>> 0) >>> 0;
      t2_lo = lo >>> 0;
      h_hi = g_hi;
      h_lo = g_lo;
      g_hi = f_hi;
      g_lo = f_lo;
      f_hi = e_hi;
      f_lo = e_lo;
      lo = d_lo + t1_lo;
      e_hi = d_hi + t1_hi + (lo / 4294967296 >>> 0) >>> 0;
      e_lo = lo >>> 0;
      d_hi = c_hi;
      d_lo = c_lo;
      c_hi = b_hi;
      c_lo = b_lo;
      b_hi = a_hi;
      b_lo = a_lo;
      lo = t1_lo + t2_lo;
      a_hi = t1_hi + t2_hi + (lo / 4294967296 >>> 0) >>> 0;
      a_lo = lo >>> 0;
    }
    lo = s[0][1] + a_lo;
    s[0][0] = s[0][0] + a_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[0][1] = lo >>> 0;
    lo = s[1][1] + b_lo;
    s[1][0] = s[1][0] + b_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[1][1] = lo >>> 0;
    lo = s[2][1] + c_lo;
    s[2][0] = s[2][0] + c_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[2][1] = lo >>> 0;
    lo = s[3][1] + d_lo;
    s[3][0] = s[3][0] + d_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[3][1] = lo >>> 0;
    lo = s[4][1] + e_lo;
    s[4][0] = s[4][0] + e_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[4][1] = lo >>> 0;
    lo = s[5][1] + f_lo;
    s[5][0] = s[5][0] + f_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[5][1] = lo >>> 0;
    lo = s[6][1] + g_lo;
    s[6][0] = s[6][0] + g_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[6][1] = lo >>> 0;
    lo = s[7][1] + h_lo;
    s[7][0] = s[7][0] + h_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[7][1] = lo >>> 0;
    len -= 128;
  }
}

export { forge as default };