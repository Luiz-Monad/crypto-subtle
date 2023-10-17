import 'module';

var sjcl = global.sjcl;
sjcl.misc.pbkdf2 = function (password, salt, count, length, Prff) {
  count = count || 10000;
  if (length < 0 || count < 0) {
    throw new sjcl.exception.invalid("invalid params to pbkdf2");
  }
  if (typeof password === "string") {
    password = sjcl.codec.utf8String.toBits(password);
  }
  if (typeof salt === "string") {
    salt = sjcl.codec.utf8String.toBits(salt);
  }
  Prff = Prff || sjcl.misc.hmac;
  var prf = new Prff(password), u, ui, i, j, k, out = [], b = sjcl.bitArray;
  for (k = 1; 32 * out.length < (length || 1); k++) {
    u = ui = prf.encrypt(b.concat(salt, [k]));
    for (i = 1; i < count; i++) {
      ui = prf.encrypt(ui);
      for (j = 0; j < ui.length; j++) {
        u[j] ^= ui[j];
      }
    }
    out = out.concat(u);
  }
  if (length) {
    out = b.clamp(out, length);
  }
  return out;
};

export { sjcl as default };
