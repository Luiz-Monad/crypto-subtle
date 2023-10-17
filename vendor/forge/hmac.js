import 'module';
import './md.js';
import './util.js';

var forge = global.forge;
var hmac = forge.hmac = forge.hmac || ({});
hmac.create = function () {
  var _key = null;
  var _md = null;
  var _ipadding = null;
  var _opadding = null;
  var ctx = {};
  ctx.start = function (md, key) {
    if (md !== null) {
      if (typeof md === "string") {
        md = md.toLowerCase();
        if ((md in forge.md.algorithms)) {
          _md = forge.md.algorithms[md].create();
        } else {
          throw new Error("Unknown hash algorithm \"" + md + "\"");
        }
      } else {
        _md = md;
      }
    }
    if (key === null) {
      key = _key;
    } else {
      if (typeof key === "string") {
        key = forge.util.createBuffer(key);
      } else if (forge.util.isArray(key)) {
        var tmp = key;
        key = forge.util.createBuffer();
        for (var i = 0; i < tmp.length; ++i) {
          key.putByte(tmp[i]);
        }
      }
      var keylen = key.length();
      if (keylen > _md.blockLength) {
        _md.start();
        _md.update(key.bytes());
        key = _md.digest();
      }
      _ipadding = forge.util.createBuffer();
      _opadding = forge.util.createBuffer();
      keylen = key.length();
      for (var i = 0; i < keylen; ++i) {
        var tmp = key.at(i);
        _ipadding.putByte(54 ^ tmp);
        _opadding.putByte(92 ^ tmp);
      }
      if (keylen < _md.blockLength) {
        var tmp = _md.blockLength - keylen;
        for (var i = 0; i < tmp; ++i) {
          _ipadding.putByte(54);
          _opadding.putByte(92);
        }
      }
      _key = key;
      _ipadding = _ipadding.bytes();
      _opadding = _opadding.bytes();
    }
    _md.start();
    _md.update(_ipadding);
  };
  ctx.update = function (bytes) {
    _md.update(bytes);
  };
  ctx.getMac = function () {
    var inner = _md.digest().bytes();
    _md.start();
    _md.update(_opadding);
    _md.update(inner);
    return _md.digest();
  };
  ctx.digest = ctx.getMac;
  return ctx;
};

export { forge as default };
