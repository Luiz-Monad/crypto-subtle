// Copyright 2016-2018 AJ ONeal. All rights reserved
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

module.exports = function (bitlen, exp) {
  bitlen = parseInt(bitlen, 10) || 2048;
  exp = parseInt(exp, 10) || 65537;
  try {
    return require('./generate-privkey-forge.js')(bitlen, exp);
  } catch (e) {
    console.error("[ERROR] rsa-compat: could not generate a private key.");
    console.error("None of crypto.generateKeyPair, ursa, nor node-forge are present");
    console.error("");
    throw e;
  }
};
