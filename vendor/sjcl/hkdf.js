"use strict";

var sjcl = require("./sjcl");
var misc = module.exports = sjcl.misc = sjcl.misc || {};
var hash = sjcl.hash;
var codec = sjcl.codec;
var bitArray = sjcl.bitArray;
/** @fileOverview HKDF implementation.
 *
 * @author Steve Thomas
 */

/** HKDF with the specified hash function.
 * @param {bitArray} ikm The input keying material.
 * @param {Number} keyBitLength The output key length, in bits.
 * @param {String|bitArray} salt The salt for HKDF.
 * @param {String|bitArray} info The info for HKDF.
 * @param {Object} [Hash=sjcl.hash.sha256] The hash function to use.
 * @return {bitArray} derived key.
 */
misc.hkdf = function (ikm, keyBitLength, salt, info, Hash) {
  var hmac,
    key,
    i,
    hashLen,
    loops,
    curOut,
    ret = [];
  Hash = Hash || hash.sha256;
  if (typeof info === "string") {
    info = codec.utf8String.toBits(info);
  }
  if (typeof salt === "string") {
    salt = codec.utf8String.toBits(salt);
  } else if (!salt) {
    salt = [];
  }
  hmac = new misc.hmac(salt, Hash);
  key = hmac.mac(ikm);
  hashLen = bitArray.bitLength(key);
  loops = Math.ceil(keyBitLength / hashLen);
  if (loops > 255) {
    throw new sjcl.exception.invalid("key bit length is too large for hkdf");
  }
  hmac = new misc.hmac(key, Hash);
  curOut = [];
  for (i = 1; i <= loops; i++) {
    hmac.update(curOut);
    hmac.update(info);
    hmac.update([bitArray.partial(8, i)]);
    curOut = hmac.digest();
    ret = bitArray.concat(ret, curOut);
  }
  return sjcl.bitArray.clamp(ret, keyBitLength);
};
