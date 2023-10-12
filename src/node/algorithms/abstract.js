function throwError(){
  throw new Error("NOT IMPLIMENTED")
}


function createAlgorithm(name) {
  //warn that there's no parameter checking
  function checkParams(){
    //console.log("WARNING: " + name + "isn't checking parameters... bad things might happen");
    return true;
  }
  //generic exporter function
  function createExporter(type, key){
    return function exportKey(format){
      if (Algorithm.formats[format].types.indexOf(Algorithm.types[type]) < 0)
        throw new Error("can't export " + type.label + " key  in " + format + " format.");

      return Algorithm.formats[format].export(key);
    };
  }

  var Algorithm = {
      name : name,
      formats : {
        raw  : {
          import : throwError,
          export : throwError,
          types  : []
        },
        jwk  : {
          import : throwError,
          export : throwError,
          types  : []
        },
        spki : {
          import : throwError,
          export : throwError,
          types  : []
        },
        pkcs8 : {
          import : throwError,
          export : throwError,
          types  : []
        }
      },
      types : {
        public  : {
          label   : "public",
          formats : [],
          usage   : {
            encrypt   : null,
            verify    : null
          },
          returnLabel : "publicKey"
        },
        private : {
          label   : "private",
          formats : [],
          usage   : {
            decrypt   : null,
            sign      : null
          },
          returnLabel : "privateKey"
        },
        secret  : {
          label   : "secret",
          formats : [],
          usage   : {
            encrypt : null,
            decrypt : null,
            sign    : null,
            verify  : null
          }
        }
      },
      usages : {
        sign       : [],
        verify     : [],
        encrypt    : [],
        decrypt    : [],
        deriveKey  : [],
        deriveBits : [],
      },
      generate        : throwError,
      checkParams     : checkParams,
      createExporter  : createExporter,
    }

    , types   = Algorithm.types
    , _secret  = types.secret
    , _public  = types.public
    , _private = types.private

    , formats = Algorithm.formats
    , jwk     = formats.jwk
    , raw     = formats.raw
    , spki    = formats.spki
    , pkcs8   = formats.pkcs8

    , usages  = Algorithm.usages
    , sign    = usages.sign
    , verify  = usages.verify
    , encrypt = usages.encrypt
    , decrypt = usages.decrypt
    , deriveKey  = usages.deriveKey
    , deriveBits = usages.deriveBits;


  // reference appropriate formats for each key type
  _private.formats.push(pkcs8);
  _private.formats.push(jwk);

  _public.formats.push(spki)
  _public.formats.push(jwk);

  _secret.formats.push(raw)
  _secret.formats.push(jwk);

  // reference appropriate key types for each format
  jwk.types.push(_secret);
  jwk.types.push(_public);
  jwk.types.push(_private);

  raw.types.push(_secret);
  raw.types.push(_private);
  raw.types.push(_public);

  spki.types.push(_public);

  pkcs8.types.push(_private);

  // reference appropriate key types for each usage
  sign.push(_secret);
  sign.push(_private);

  verify.push(_secret);
  verify.push(_public);

  encrypt.push(_secret);
  encrypt.push(_public);

  decrypt.push(_secret);
  decrypt.push(_private);

  deriveKey.push(_private);

  deriveBits.push(_private);

  return Algorithm;
}

module.exports = createAlgorithm;
