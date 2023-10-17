import 'module';
import ASN1 from './asn1.js';
import Enc from './encoding.js';

var X509 = global.X509;
var X509 = module.exports;
X509.packCsr = function (asn1pubkey, domains) {
  return ASN1("30", ASN1.UInt("00"), ASN1("30", ASN1("31", ASN1("30", ASN1("06", "550403"), ASN1("0c", Enc.utf8ToHex(domains[0]))))), asn1pubkey, ASN1("a0", ASN1("30", ASN1("06", "2a864886f70d01090e"), ASN1("31", ASN1("30", ASN1("30", ASN1("06", "551d11"), ASN1("04", ASN1("30", domains.map(function (d) {
    return ASN1("82", Enc.utf8ToHex(d));
  }).join("")))))))));
};
X509.packPkcs1 = function (jwk) {
  var n = ASN1.UInt(Enc.base64ToHex(jwk.n));
  var e = ASN1.UInt(Enc.base64ToHex(jwk.e));
  if (!jwk.d) {
    return Enc.hexToBuf(ASN1("30", n, e));
  }
  return Enc.hexToBuf(ASN1("30", ASN1.UInt("00"), n, e, ASN1.UInt(Enc.base64ToHex(jwk.d)), ASN1.UInt(Enc.base64ToHex(jwk.p)), ASN1.UInt(Enc.base64ToHex(jwk.q)), ASN1.UInt(Enc.base64ToHex(jwk.dp)), ASN1.UInt(Enc.base64ToHex(jwk.dq)), ASN1.UInt(Enc.base64ToHex(jwk.qi))));
};
X509.packCsrPublicKey = function (jwk) {
  var n = ASN1.UInt(Enc.base64ToHex(jwk.n));
  var e = ASN1.UInt(Enc.base64ToHex(jwk.e));
  var asn1pub = ASN1("30", n, e);
  return ASN1("30", ASN1("30", ASN1("06", "2a864886f70d010101"), ASN1("05")), ASN1.BitStr(asn1pub));
};
var X509$1 = X509;

export { X509$1 as default };
