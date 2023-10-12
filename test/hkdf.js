
var Internal = {};

Internal.crypto = {
    getRandomBytes: function(size) {
        var array = new Uint8Array(size);
        crypto.getRandomValues(array);
        return array.buffer;
    },
    encrypt: function(key, data, iv) {
        return crypto.subtle.importKey('raw', key, {name: 'AES-CBC'}, false, ['encrypt']).then(function(key) {
            return crypto.subtle.encrypt({name: 'AES-CBC', iv: new Uint8Array(iv)}, key, data);
        });
    },
    decrypt: function(key, data, iv) {
        return crypto.subtle.importKey('raw', key, {name: 'AES-CBC'}, false, ['decrypt']).then(function(key) {
            return crypto.subtle.decrypt({name: 'AES-CBC', iv: new Uint8Array(iv)}, key, data);
        });
    },
    sign: function(key, data) {
        return crypto.subtle.importKey('raw', key, {name: 'HMAC', hash: {name: 'SHA-256'}}, false, ['sign']).then(function(key) {
            return crypto.subtle.sign( {name: 'HMAC', hash: 'SHA-256'}, key, data);
        });
    },

    hash: function(data) {
        return crypto.subtle.digest({name: 'SHA-512'}, data);
    },

    HKDF: function(input, salt, info) {
        // Specific implementation of RFC 5869 that only returns the first 3 32-byte chunks
        // TODO: We dont always need the third chunk, we might skip it
        return Internal.crypto.sign(salt, input).then(function(PRK) {
            var infoBuffer = new ArrayBuffer(info.byteLength + 1 + 32);
            var infoArray = new Uint8Array(infoBuffer);
            infoArray.set(new Uint8Array(info), 32);
            infoArray[infoArray.length - 1] = 1;
            return Internal.crypto.sign(PRK, infoBuffer.slice(32)).then(function(T1) {
                infoArray.set(new Uint8Array(T1));
                infoArray[infoArray.length - 1] = 2;
                return Internal.crypto.sign(PRK, infoBuffer).then(function(T2) {
                    infoArray.set(new Uint8Array(T2));
                    infoArray[infoArray.length - 1] = 3;
                    return Internal.crypto.sign(PRK, infoBuffer).then(function(T3) {
                        return [ T1, T2, T3 ];
                    });
                });
            });
        });
    },
}

function testHKDF() {
    const salt = Internal.crypto.getRandomBytes(32);
    const inputKey = Internal.crypto.getRandomBytes(64);
    const info = Internal.crypto.getRandomBytes(32);

    Internal.crypto.HKDF(inputKey, salt, info)
        .then((derivedKeys) => {
            console.log('Derived Keys:');
            console.log('T1:', new Uint8Array(derivedKeys[0]));
            console.log('T2:', new Uint8Array(derivedKeys[1]));
            console.log('T3:', new Uint8Array(derivedKeys[2]));
        })
        .catch((error) => {
            console.error('HKDF Error:', error);
        });
}

testHKDF();
