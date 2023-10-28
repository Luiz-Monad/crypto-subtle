import 'module';
import './util.js';

var forge = global.forge;
var sha1 = forge.sha1 = forge.sha1 || ({});
forge.md = forge.md || ({});
forge.md.algorithms = forge.md.algorithms || ({});
forge.md.sha1 = forge.md.algorithms.sha1 = sha1;
sha1.create = function () {
  if (!_initialized) {
    _init();
  }
  var _state = null;
  var _input = forge.util.createBuffer();
  var _w = new Array(80);
  var md = {
    algorithm: "sha1",
    blockLength: 64,
    digestLength: 20,
    messageLength: 0,
    fullMessageLength: null,
    messageLengthSize: 8
  };
  md.start = function () {
    md.messageLength = 0;
    md.fullMessageLength = md.messageLength64 = [];
    var int32s = md.messageLengthSize / 4;
    for (var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = forge.util.createBuffer();
    _state = {
      h0: 1732584193,
      h1: 4023233417,
      h2: 2562383102,
      h3: 271733878,
      h4: 3285377520
    };
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
    _update(_state, _w, _input);
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
    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3,
      h4: _state.h4
    };
    _update(s2, _w, finalBlock);
    var rval = forge.util.createBuffer();
    rval.putInt32(s2.h0);
    rval.putInt32(s2.h1);
    rval.putInt32(s2.h2);
    rval.putInt32(s2.h3);
    rval.putInt32(s2.h4);
    return rval;
  };
  return md;
};
var _padding = null;
var _initialized = false;
function _init() {
  _padding = String.fromCharCode(128);
  _padding += forge.util.fillString(String.fromCharCode(0), 64);
  _initialized = true;
}
function _update(s, w, bytes) {
  var t, a, b, c, d, e, f, i;
  var len = bytes.length();
  while (len >= 64) {
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;
    for (i = 0; i < 16; ++i) {
      t = bytes.getInt32();
      w[i] = t;
      f = d ^ b & (c ^ d);
      t = (a << 5 | a >>> 27) + f + e + 1518500249 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 20; ++i) {
      t = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      t = t << 1 | t >>> 31;
      w[i] = t;
      f = d ^ b & (c ^ d);
      t = (a << 5 | a >>> 27) + f + e + 1518500249 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 32; ++i) {
      t = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      t = t << 1 | t >>> 31;
      w[i] = t;
      f = b ^ c ^ d;
      t = (a << 5 | a >>> 27) + f + e + 1859775393 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 40; ++i) {
      t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
      t = t << 2 | t >>> 30;
      w[i] = t;
      f = b ^ c ^ d;
      t = (a << 5 | a >>> 27) + f + e + 1859775393 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 60; ++i) {
      t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
      t = t << 2 | t >>> 30;
      w[i] = t;
      f = b & c | d & (b ^ c);
      t = (a << 5 | a >>> 27) + f + e + 2400959708 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 80; ++i) {
      t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
      t = t << 2 | t >>> 30;
      w[i] = t;
      f = b ^ c ^ d;
      t = (a << 5 | a >>> 27) + f + e + 3395469782 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    s.h0 = s.h0 + a | 0;
    s.h1 = s.h1 + b | 0;
    s.h2 = s.h2 + c | 0;
    s.h3 = s.h3 + d | 0;
    s.h4 = s.h4 + e | 0;
    len -= 64;
  }
}

export { forge as default };
