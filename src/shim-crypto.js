
function randomBytes(length) {
    (0, index_js_1.assert)(window.crypto != null, "platform does not support secure random numbers", "UNSUPPORTED_OPERATION", {
        operation: "randomBytes"
    });
    (0, index_js_1.assertArgument)(Number.isInteger(length) && length > 0 && length <= 1024, "invalid length", "length", length);
    const result = new Uint8Array(length);
    window.crypto.getRandomValues(result);
    return result;
}
exports.randomBytes = randomBytes;

function createHmac(_algo, key) {
    const algo = ({ sha256: sha256_1.sha256, sha512: sha512_1.sha512 }[_algo]);
    (0, index_js_1.assertArgument)(algo != null, "invalid hmac algorithm", "algorithm", _algo);
    return hmac_1.hmac.create(algo, key);
}
exports.createHmac = createHmac;
