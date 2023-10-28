import 'module';
import './asn1.js';
import './hmac.js';
import './md.js';
import './pem.js';
import './pki.js';
import './random.js';
import './util.js';

var forge = global.forge;
var prf_TLS1 = function (secret, label, seed, length) {
  var rval = forge.util.createBuffer();
  var idx = secret.length >> 1;
  var slen = idx + (secret.length & 1);
  var s1 = secret.substr(0, slen);
  var s2 = secret.substr(idx, slen);
  var ai = forge.util.createBuffer();
  var hmac = forge.hmac.create();
  seed = label + seed;
  var md5itr = Math.ceil(length / 16);
  var sha1itr = Math.ceil(length / 20);
  hmac.start("MD5", s1);
  var md5bytes = forge.util.createBuffer();
  ai.putBytes(seed);
  for (var i = 0; i < md5itr; ++i) {
    hmac.start(null, null);
    hmac.update(ai.getBytes());
    ai.putBuffer(hmac.digest());
    hmac.start(null, null);
    hmac.update(ai.bytes() + seed);
    md5bytes.putBuffer(hmac.digest());
  }
  hmac.start("SHA1", s2);
  var sha1bytes = forge.util.createBuffer();
  ai.clear();
  ai.putBytes(seed);
  for (var i = 0; i < sha1itr; ++i) {
    hmac.start(null, null);
    hmac.update(ai.getBytes());
    ai.putBuffer(hmac.digest());
    hmac.start(null, null);
    hmac.update(ai.bytes() + seed);
    sha1bytes.putBuffer(hmac.digest());
  }
  rval.putBytes(forge.util.xorBytes(md5bytes.getBytes(), sha1bytes.getBytes(), length));
  return rval;
};
var hmac_sha1 = function (key, seqNum, record) {
  var hmac = forge.hmac.create();
  hmac.start("SHA1", key);
  var b = forge.util.createBuffer();
  b.putInt32(seqNum[0]);
  b.putInt32(seqNum[1]);
  b.putByte(record.type);
  b.putByte(record.version.major);
  b.putByte(record.version.minor);
  b.putInt16(record.length);
  b.putBytes(record.fragment.bytes());
  hmac.update(b.getBytes());
  return hmac.digest().getBytes();
};
var deflate = function (c, record, s) {
  var rval = false;
  try {
    var bytes = c.deflate(record.fragment.getBytes());
    record.fragment = forge.util.createBuffer(bytes);
    record.length = bytes.length;
    rval = true;
  } catch (ex) {}
  return rval;
};
var inflate = function (c, record, s) {
  var rval = false;
  try {
    var bytes = c.inflate(record.fragment.getBytes());
    record.fragment = forge.util.createBuffer(bytes);
    record.length = bytes.length;
    rval = true;
  } catch (ex) {}
  return rval;
};
var readVector = function (b, lenBytes) {
  var len = 0;
  switch (lenBytes) {
    case 1:
      len = b.getByte();
      break;
    case 2:
      len = b.getInt16();
      break;
    case 3:
      len = b.getInt24();
      break;
    case 4:
      len = b.getInt32();
      break;
  }
  return forge.util.createBuffer(b.getBytes(len));
};
var writeVector = function (b, lenBytes, v) {
  b.putInt(v.length(), lenBytes << 3);
  b.putBuffer(v);
};
var tls = {};
tls.Versions = {
  TLS_1_0: {
    major: 3,
    minor: 1
  },
  TLS_1_1: {
    major: 3,
    minor: 2
  },
  TLS_1_2: {
    major: 3,
    minor: 3
  }
};
tls.SupportedVersions = [tls.Versions.TLS_1_1, tls.Versions.TLS_1_0];
tls.Version = tls.SupportedVersions[0];
tls.MaxFragment = 16384 - 1024;
tls.ConnectionEnd = {
  server: 0,
  client: 1
};
tls.PRFAlgorithm = {
  tls_prf_sha256: 0
};
tls.BulkCipherAlgorithm = {
  none: null,
  rc4: 0,
  des3: 1,
  aes: 2
};
tls.CipherType = {
  stream: 0,
  block: 1,
  aead: 2
};
tls.MACAlgorithm = {
  none: null,
  hmac_md5: 0,
  hmac_sha1: 1,
  hmac_sha256: 2,
  hmac_sha384: 3,
  hmac_sha512: 4
};
tls.CompressionMethod = {
  none: 0,
  deflate: 1
};
tls.ContentType = {
  change_cipher_spec: 20,
  alert: 21,
  handshake: 22,
  application_data: 23,
  heartbeat: 24
};
tls.HandshakeType = {
  hello_request: 0,
  client_hello: 1,
  server_hello: 2,
  certificate: 11,
  server_key_exchange: 12,
  certificate_request: 13,
  server_hello_done: 14,
  certificate_verify: 15,
  client_key_exchange: 16,
  finished: 20
};
tls.Alert = {};
tls.Alert.Level = {
  warning: 1,
  fatal: 2
};
tls.Alert.Description = {
  close_notify: 0,
  unexpected_message: 10,
  bad_record_mac: 20,
  decryption_failed: 21,
  record_overflow: 22,
  decompression_failure: 30,
  handshake_failure: 40,
  bad_certificate: 42,
  unsupported_certificate: 43,
  certificate_revoked: 44,
  certificate_expired: 45,
  certificate_unknown: 46,
  illegal_parameter: 47,
  unknown_ca: 48,
  access_denied: 49,
  decode_error: 50,
  decrypt_error: 51,
  export_restriction: 60,
  protocol_version: 70,
  insufficient_security: 71,
  internal_error: 80,
  user_canceled: 90,
  no_renegotiation: 100
};
tls.HeartbeatMessageType = {
  heartbeat_request: 1,
  heartbeat_response: 2
};
tls.CipherSuites = {};
tls.getCipherSuite = function (twoBytes) {
  var rval = null;
  for (var key in tls.CipherSuites) {
    var cs = tls.CipherSuites[key];
    if (cs.id[0] === twoBytes.charCodeAt(0) && cs.id[1] === twoBytes.charCodeAt(1)) {
      rval = cs;
      break;
    }
  }
  return rval;
};
tls.handleUnexpected = function (c, record) {
  var ignore = !c.open && c.entity === tls.ConnectionEnd.client;
  if (!ignore) {
    c.error(c, {
      message: "Unexpected message. Received TLS record out of order.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.unexpected_message
      }
    });
  }
};
tls.handleHelloRequest = function (c, record, length) {
  if (!c.handshaking && c.handshakes > 0) {
    tls.queue(c, tls.createAlert(c, {
      level: tls.Alert.Level.warning,
      description: tls.Alert.Description.no_renegotiation
    }));
    tls.flush(c);
  }
  c.process();
};
tls.parseHelloMessage = function (c, record, length) {
  var msg = null;
  var client = c.entity === tls.ConnectionEnd.client;
  if (length < 38) {
    c.error(c, {
      message: client ? "Invalid ServerHello message. Message too short." : "Invalid ClientHello message. Message too short.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.illegal_parameter
      }
    });
  } else {
    var b = record.fragment;
    var remaining = b.length();
    msg = {
      version: {
        major: b.getByte(),
        minor: b.getByte()
      },
      random: forge.util.createBuffer(b.getBytes(32)),
      session_id: readVector(b, 1),
      extensions: []
    };
    if (client) {
      msg.cipher_suite = b.getBytes(2);
      msg.compression_method = b.getByte();
    } else {
      msg.cipher_suites = readVector(b, 2);
      msg.compression_methods = readVector(b, 1);
    }
    remaining = length - (remaining - b.length());
    if (remaining > 0) {
      var exts = readVector(b, 2);
      while (exts.length() > 0) {
        msg.extensions.push({
          type: [exts.getByte(), exts.getByte()],
          data: readVector(exts, 2)
        });
      }
      if (!client) {
        for (var i = 0; i < msg.extensions.length; ++i) {
          var ext = msg.extensions[i];
          if (ext.type[0] === 0 && ext.type[1] === 0) {
            var snl = readVector(ext.data, 2);
            while (snl.length() > 0) {
              var snType = snl.getByte();
              if (snType !== 0) {
                break;
              }
              c.session.extensions.server_name.serverNameList.push(readVector(snl, 2).getBytes());
            }
          }
        }
      }
    }
    if (c.session.version) {
      if (msg.version.major !== c.session.version.major || msg.version.minor !== c.session.version.minor) {
        return c.error(c, {
          message: "TLS version change is disallowed during renegotiation.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.protocol_version
          }
        });
      }
    }
    if (client) {
      c.session.cipherSuite = tls.getCipherSuite(msg.cipher_suite);
    } else {
      var tmp = forge.util.createBuffer(msg.cipher_suites.bytes());
      while (tmp.length() > 0) {
        c.session.cipherSuite = tls.getCipherSuite(tmp.getBytes(2));
        if (c.session.cipherSuite !== null) {
          break;
        }
      }
    }
    if (c.session.cipherSuite === null) {
      return c.error(c, {
        message: "No cipher suites in common.",
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.handshake_failure
        },
        cipherSuite: forge.util.bytesToHex(msg.cipher_suite)
      });
    }
    if (client) {
      c.session.compressionMethod = msg.compression_method;
    } else {
      c.session.compressionMethod = tls.CompressionMethod.none;
    }
  }
  return msg;
};
tls.createSecurityParameters = function (c, msg) {
  var client = c.entity === tls.ConnectionEnd.client;
  var msgRandom = msg.random.bytes();
  var cRandom = client ? c.session.sp.client_random : msgRandom;
  var sRandom = client ? msgRandom : tls.createRandom().getBytes();
  c.session.sp = {
    entity: c.entity,
    prf_algorithm: tls.PRFAlgorithm.tls_prf_sha256,
    bulk_cipher_algorithm: null,
    cipher_type: null,
    enc_key_length: null,
    block_length: null,
    fixed_iv_length: null,
    record_iv_length: null,
    mac_algorithm: null,
    mac_length: null,
    mac_key_length: null,
    compression_algorithm: c.session.compressionMethod,
    pre_master_secret: null,
    master_secret: null,
    client_random: cRandom,
    server_random: sRandom
  };
};
tls.handleServerHello = function (c, record, length) {
  var msg = tls.parseHelloMessage(c, record, length);
  if (c.fail) {
    return;
  }
  if (msg.version.minor <= c.version.minor) {
    c.version.minor = msg.version.minor;
  } else {
    return c.error(c, {
      message: "Incompatible TLS version.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.protocol_version
      }
    });
  }
  c.session.version = c.version;
  var sessionId = msg.session_id.bytes();
  if (sessionId.length > 0 && sessionId === c.session.id) {
    c.expect = SCC;
    c.session.resuming = true;
    c.session.sp.server_random = msg.random.bytes();
  } else {
    c.expect = SCE;
    c.session.resuming = false;
    tls.createSecurityParameters(c, msg);
  }
  c.session.id = sessionId;
  c.process();
};
tls.handleClientHello = function (c, record, length) {
  var msg = tls.parseHelloMessage(c, record, length);
  if (c.fail) {
    return;
  }
  var sessionId = msg.session_id.bytes();
  var session = null;
  if (c.sessionCache) {
    session = c.sessionCache.getSession(sessionId);
    if (session === null) {
      sessionId = "";
    } else if (session.version.major !== msg.version.major || session.version.minor > msg.version.minor) {
      session = null;
      sessionId = "";
    }
  }
  if (sessionId.length === 0) {
    sessionId = forge.random.getBytes(32);
  }
  c.session.id = sessionId;
  c.session.clientHelloVersion = msg.version;
  c.session.sp = {};
  if (session) {
    c.version = c.session.version = session.version;
    c.session.sp = session.sp;
  } else {
    var version;
    for (var i = 1; i < tls.SupportedVersions.length; ++i) {
      version = tls.SupportedVersions[i];
      if (version.minor <= msg.version.minor) {
        break;
      }
    }
    c.version = {
      major: version.major,
      minor: version.minor
    };
    c.session.version = c.version;
  }
  if (session !== null) {
    c.expect = CCC;
    c.session.resuming = true;
    c.session.sp.client_random = msg.random.bytes();
  } else {
    c.expect = c.verifyClient !== false ? CCE : CKE;
    c.session.resuming = false;
    tls.createSecurityParameters(c, msg);
  }
  c.open = true;
  tls.queue(c, tls.createRecord(c, {
    type: tls.ContentType.handshake,
    data: tls.createServerHello(c)
  }));
  if (c.session.resuming) {
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.change_cipher_spec,
      data: tls.createChangeCipherSpec()
    }));
    c.state.pending = tls.createConnectionState(c);
    c.state.current.write = c.state.pending.write;
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.handshake,
      data: tls.createFinished(c)
    }));
  } else {
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.handshake,
      data: tls.createCertificate(c)
    }));
    if (!c.fail) {
      tls.queue(c, tls.createRecord(c, {
        type: tls.ContentType.handshake,
        data: tls.createServerKeyExchange(c)
      }));
      if (c.verifyClient !== false) {
        tls.queue(c, tls.createRecord(c, {
          type: tls.ContentType.handshake,
          data: tls.createCertificateRequest(c)
        }));
      }
      tls.queue(c, tls.createRecord(c, {
        type: tls.ContentType.handshake,
        data: tls.createServerHelloDone(c)
      }));
    }
  }
  tls.flush(c);
  c.process();
};
tls.handleCertificate = function (c, record, length) {
  if (length < 3) {
    return c.error(c, {
      message: "Invalid Certificate message. Message too short.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.illegal_parameter
      }
    });
  }
  var b = record.fragment;
  var msg = {
    certificate_list: readVector(b, 3)
  };
  var cert, asn1;
  var certs = [];
  try {
    while (msg.certificate_list.length() > 0) {
      cert = readVector(msg.certificate_list, 3);
      asn1 = forge.asn1.fromDer(cert);
      cert = forge.pki.certificateFromAsn1(asn1, true);
      certs.push(cert);
    }
  } catch (ex) {
    return c.error(c, {
      message: "Could not parse certificate list.",
      cause: ex,
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.bad_certificate
      }
    });
  }
  var client = c.entity === tls.ConnectionEnd.client;
  if ((client || c.verifyClient === true) && certs.length === 0) {
    c.error(c, {
      message: client ? "No server certificate provided." : "No client certificate provided.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.illegal_parameter
      }
    });
  } else if (certs.length === 0) {
    c.expect = client ? SKE : CKE;
  } else {
    if (client) {
      c.session.serverCertificate = certs[0];
    } else {
      c.session.clientCertificate = certs[0];
    }
    if (tls.verifyCertificateChain(c, certs)) {
      c.expect = client ? SKE : CKE;
    }
  }
  c.process();
};
tls.handleServerKeyExchange = function (c, record, length) {
  if (length > 0) {
    return c.error(c, {
      message: "Invalid key parameters. Only RSA is supported.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.unsupported_certificate
      }
    });
  }
  c.expect = SCR;
  c.process();
};
tls.handleClientKeyExchange = function (c, record, length) {
  if (length < 48) {
    return c.error(c, {
      message: "Invalid key parameters. Only RSA is supported.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.unsupported_certificate
      }
    });
  }
  var b = record.fragment;
  var msg = {
    enc_pre_master_secret: readVector(b, 2).getBytes()
  };
  var privateKey = null;
  if (c.getPrivateKey) {
    try {
      privateKey = c.getPrivateKey(c, c.session.serverCertificate);
      privateKey = forge.pki.privateKeyFromPem(privateKey);
    } catch (ex) {
      c.error(c, {
        message: "Could not get private key.",
        cause: ex,
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.internal_error
        }
      });
    }
  }
  if (privateKey === null) {
    return c.error(c, {
      message: "No private key set.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.internal_error
      }
    });
  }
  try {
    var sp = c.session.sp;
    sp.pre_master_secret = privateKey.decrypt(msg.enc_pre_master_secret);
    var version = c.session.clientHelloVersion;
    if (version.major !== sp.pre_master_secret.charCodeAt(0) || version.minor !== sp.pre_master_secret.charCodeAt(1)) {
      throw new Error("TLS version rollback attack detected.");
    }
  } catch (ex) {
    sp.pre_master_secret = forge.random.getBytes(48);
  }
  c.expect = CCC;
  if (c.session.clientCertificate !== null) {
    c.expect = CCV;
  }
  c.process();
};
tls.handleCertificateRequest = function (c, record, length) {
  if (length < 3) {
    return c.error(c, {
      message: "Invalid CertificateRequest. Message too short.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.illegal_parameter
      }
    });
  }
  var b = record.fragment;
  var msg = {
    certificate_types: readVector(b, 1),
    certificate_authorities: readVector(b, 2)
  };
  c.session.certificateRequest = msg;
  c.expect = SHD;
  c.process();
};
tls.handleCertificateVerify = function (c, record, length) {
  if (length < 2) {
    return c.error(c, {
      message: "Invalid CertificateVerify. Message too short.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.illegal_parameter
      }
    });
  }
  var b = record.fragment;
  b.read -= 4;
  var msgBytes = b.bytes();
  b.read += 4;
  var msg = {
    signature: readVector(b, 2).getBytes()
  };
  var verify = forge.util.createBuffer();
  verify.putBuffer(c.session.md5.digest());
  verify.putBuffer(c.session.sha1.digest());
  verify = verify.getBytes();
  try {
    var cert = c.session.clientCertificate;
    if (!cert.publicKey.verify(verify, msg.signature, "NONE")) {
      throw new Error("CertificateVerify signature does not match.");
    }
    c.session.md5.update(msgBytes);
    c.session.sha1.update(msgBytes);
  } catch (ex) {
    return c.error(c, {
      message: "Bad signature in CertificateVerify.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.handshake_failure
      }
    });
  }
  c.expect = CCC;
  c.process();
};
tls.handleServerHelloDone = function (c, record, length) {
  if (length > 0) {
    return c.error(c, {
      message: "Invalid ServerHelloDone message. Invalid length.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.record_overflow
      }
    });
  }
  if (c.serverCertificate === null) {
    var error = {
      message: "No server certificate provided. Not enough security.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.insufficient_security
      }
    };
    var depth = 0;
    var ret = c.verify(c, error.alert.description, depth, []);
    if (ret !== true) {
      if (ret || ret === 0) {
        if (typeof ret === "object" && !forge.util.isArray(ret)) {
          if (ret.message) {
            error.message = ret.message;
          }
          if (ret.alert) {
            error.alert.description = ret.alert;
          }
        } else if (typeof ret === "number") {
          error.alert.description = ret;
        }
      }
      return c.error(c, error);
    }
  }
  if (c.session.certificateRequest !== null) {
    record = tls.createRecord(c, {
      type: tls.ContentType.handshake,
      data: tls.createCertificate(c)
    });
    tls.queue(c, record);
  }
  record = tls.createRecord(c, {
    type: tls.ContentType.handshake,
    data: tls.createClientKeyExchange(c)
  });
  tls.queue(c, record);
  c.expect = SER;
  var callback = function (c, signature) {
    if (c.session.certificateRequest !== null && c.session.clientCertificate !== null) {
      tls.queue(c, tls.createRecord(c, {
        type: tls.ContentType.handshake,
        data: tls.createCertificateVerify(c, signature)
      }));
    }
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.change_cipher_spec,
      data: tls.createChangeCipherSpec()
    }));
    c.state.pending = tls.createConnectionState(c);
    c.state.current.write = c.state.pending.write;
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.handshake,
      data: tls.createFinished(c)
    }));
    c.expect = SCC;
    tls.flush(c);
    c.process();
  };
  if (c.session.certificateRequest === null || c.session.clientCertificate === null) {
    return callback(c, null);
  }
  tls.getClientSignature(c, callback);
};
tls.handleChangeCipherSpec = function (c, record) {
  if (record.fragment.getByte() !== 1) {
    return c.error(c, {
      message: "Invalid ChangeCipherSpec message received.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.illegal_parameter
      }
    });
  }
  var client = c.entity === tls.ConnectionEnd.client;
  if (c.session.resuming && client || !c.session.resuming && !client) {
    c.state.pending = tls.createConnectionState(c);
  }
  c.state.current.read = c.state.pending.read;
  if (!c.session.resuming && client || c.session.resuming && !client) {
    c.state.pending = null;
  }
  c.expect = client ? SFI : CFI;
  c.process();
};
tls.handleFinished = function (c, record, length) {
  var b = record.fragment;
  b.read -= 4;
  var msgBytes = b.bytes();
  b.read += 4;
  var vd = record.fragment.getBytes();
  b = forge.util.createBuffer();
  b.putBuffer(c.session.md5.digest());
  b.putBuffer(c.session.sha1.digest());
  var client = c.entity === tls.ConnectionEnd.client;
  var label = client ? "server finished" : "client finished";
  var sp = c.session.sp;
  var vdl = 12;
  var prf = prf_TLS1;
  b = prf(sp.master_secret, label, b.getBytes(), vdl);
  if (b.getBytes() !== vd) {
    return c.error(c, {
      message: "Invalid verify_data in Finished message.",
      send: true,
      alert: {
        level: tls.Alert.Level.fatal,
        description: tls.Alert.Description.decrypt_error
      }
    });
  }
  c.session.md5.update(msgBytes);
  c.session.sha1.update(msgBytes);
  if (c.session.resuming && client || !c.session.resuming && !client) {
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.change_cipher_spec,
      data: tls.createChangeCipherSpec()
    }));
    c.state.current.write = c.state.pending.write;
    c.state.pending = null;
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.handshake,
      data: tls.createFinished(c)
    }));
  }
  c.expect = client ? SAD : CAD;
  c.handshaking = false;
  ++c.handshakes;
  c.peerCertificate = client ? c.session.serverCertificate : c.session.clientCertificate;
  tls.flush(c);
  c.isConnected = true;
  c.connected(c);
  c.process();
};
tls.handleAlert = function (c, record) {
  var b = record.fragment;
  var alert = {
    level: b.getByte(),
    description: b.getByte()
  };
  var msg;
  switch (alert.description) {
    case tls.Alert.Description.close_notify:
      msg = "Connection closed.";
      break;
    case tls.Alert.Description.unexpected_message:
      msg = "Unexpected message.";
      break;
    case tls.Alert.Description.bad_record_mac:
      msg = "Bad record MAC.";
      break;
    case tls.Alert.Description.decryption_failed:
      msg = "Decryption failed.";
      break;
    case tls.Alert.Description.record_overflow:
      msg = "Record overflow.";
      break;
    case tls.Alert.Description.decompression_failure:
      msg = "Decompression failed.";
      break;
    case tls.Alert.Description.handshake_failure:
      msg = "Handshake failure.";
      break;
    case tls.Alert.Description.bad_certificate:
      msg = "Bad certificate.";
      break;
    case tls.Alert.Description.unsupported_certificate:
      msg = "Unsupported certificate.";
      break;
    case tls.Alert.Description.certificate_revoked:
      msg = "Certificate revoked.";
      break;
    case tls.Alert.Description.certificate_expired:
      msg = "Certificate expired.";
      break;
    case tls.Alert.Description.certificate_unknown:
      msg = "Certificate unknown.";
      break;
    case tls.Alert.Description.illegal_parameter:
      msg = "Illegal parameter.";
      break;
    case tls.Alert.Description.unknown_ca:
      msg = "Unknown certificate authority.";
      break;
    case tls.Alert.Description.access_denied:
      msg = "Access denied.";
      break;
    case tls.Alert.Description.decode_error:
      msg = "Decode error.";
      break;
    case tls.Alert.Description.decrypt_error:
      msg = "Decrypt error.";
      break;
    case tls.Alert.Description.export_restriction:
      msg = "Export restriction.";
      break;
    case tls.Alert.Description.protocol_version:
      msg = "Unsupported protocol version.";
      break;
    case tls.Alert.Description.insufficient_security:
      msg = "Insufficient security.";
      break;
    case tls.Alert.Description.internal_error:
      msg = "Internal error.";
      break;
    case tls.Alert.Description.user_canceled:
      msg = "User canceled.";
      break;
    case tls.Alert.Description.no_renegotiation:
      msg = "Renegotiation not supported.";
      break;
    default:
      msg = "Unknown error.";
      break;
  }
  if (alert.description === tls.Alert.Description.close_notify) {
    return c.close();
  }
  c.error(c, {
    message: msg,
    send: false,
    origin: c.entity === tls.ConnectionEnd.client ? "server" : "client",
    alert: alert
  });
  c.process();
};
tls.handleHandshake = function (c, record) {
  var b = record.fragment;
  var type = b.getByte();
  var length = b.getInt24();
  if (length > b.length()) {
    c.fragmented = record;
    record.fragment = forge.util.createBuffer();
    b.read -= 4;
    return c.process();
  }
  c.fragmented = null;
  b.read -= 4;
  var bytes = b.bytes(length + 4);
  b.read += 4;
  if ((type in hsTable[c.entity][c.expect])) {
    if (c.entity === tls.ConnectionEnd.server && !c.open && !c.fail) {
      c.handshaking = true;
      c.session = {
        version: null,
        extensions: {
          server_name: {
            serverNameList: []
          }
        },
        cipherSuite: null,
        compressionMethod: null,
        serverCertificate: null,
        clientCertificate: null,
        md5: forge.md.md5.create(),
        sha1: forge.md.sha1.create()
      };
    }
    if (type !== tls.HandshakeType.hello_request && type !== tls.HandshakeType.certificate_verify && type !== tls.HandshakeType.finished) {
      c.session.md5.update(bytes);
      c.session.sha1.update(bytes);
    }
    hsTable[c.entity][c.expect][type](c, record, length);
  } else {
    tls.handleUnexpected(c, record);
  }
};
tls.handleApplicationData = function (c, record) {
  c.data.putBuffer(record.fragment);
  c.dataReady(c);
  c.process();
};
tls.handleHeartbeat = function (c, record) {
  var b = record.fragment;
  var type = b.getByte();
  var length = b.getInt16();
  var payload = b.getBytes(length);
  if (type === tls.HeartbeatMessageType.heartbeat_request) {
    if (c.handshaking || length > payload.length) {
      return c.process();
    }
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.heartbeat,
      data: tls.createHeartbeat(tls.HeartbeatMessageType.heartbeat_response, payload)
    }));
    tls.flush(c);
  } else if (type === tls.HeartbeatMessageType.heartbeat_response) {
    if (payload !== c.expectedHeartbeatPayload) {
      return c.process();
    }
    if (c.heartbeatReceived) {
      c.heartbeatReceived(c, forge.util.createBuffer(payload));
    }
  }
  c.process();
};
var SHE = 0;
var SCE = 1;
var SKE = 2;
var SCR = 3;
var SHD = 4;
var SCC = 5;
var SFI = 6;
var SAD = 7;
var SER = 8;
var CHE = 0;
var CCE = 1;
var CKE = 2;
var CCV = 3;
var CCC = 4;
var CFI = 5;
var CAD = 6;
var __ = tls.handleUnexpected;
var R0 = tls.handleChangeCipherSpec;
var R1 = tls.handleAlert;
var R2 = tls.handleHandshake;
var R3 = tls.handleApplicationData;
var R4 = tls.handleHeartbeat;
var ctTable = [];
ctTable[tls.ConnectionEnd.client] = [[__, R1, R2, __, R4], [__, R1, R2, __, R4], [__, R1, R2, __, R4], [__, R1, R2, __, R4], [__, R1, R2, __, R4], [R0, R1, __, __, R4], [__, R1, R2, __, R4], [__, R1, R2, R3, R4], [__, R1, R2, __, R4]];
ctTable[tls.ConnectionEnd.server] = [[__, R1, R2, __, R4], [__, R1, R2, __, R4], [__, R1, R2, __, R4], [__, R1, R2, __, R4], [R0, R1, __, __, R4], [__, R1, R2, __, R4], [__, R1, R2, R3, R4], [__, R1, R2, __, R4]];
var H0 = tls.handleHelloRequest;
var H1 = tls.handleServerHello;
var H2 = tls.handleCertificate;
var H3 = tls.handleServerKeyExchange;
var H4 = tls.handleCertificateRequest;
var H5 = tls.handleServerHelloDone;
var H6 = tls.handleFinished;
var hsTable = [];
hsTable[tls.ConnectionEnd.client] = [[__, __, H1, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, H2, H3, H4, H5, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, __, H3, H4, H5, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, __, __, H4, H5, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, H5, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H6], [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __], [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __]];
var H7 = tls.handleClientHello;
var H8 = tls.handleClientKeyExchange;
var H9 = tls.handleCertificateVerify;
hsTable[tls.ConnectionEnd.server] = [[__, H7, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __], [__, __, __, __, __, __, __, __, __, __, __, H2, __, __, __, __, __, __, __, __, __], [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H8, __, __, __, __], [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H9, __, __, __, __, __], [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __], [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H6], [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __], [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __]];
tls.generateKeys = function (c, sp) {
  var prf = prf_TLS1;
  var random = sp.client_random + sp.server_random;
  if (!c.session.resuming) {
    sp.master_secret = prf(sp.pre_master_secret, "master secret", random, 48).bytes();
    sp.pre_master_secret = null;
  }
  random = sp.server_random + sp.client_random;
  var length = 2 * sp.mac_key_length + 2 * sp.enc_key_length;
  var tls10 = c.version.major === tls.Versions.TLS_1_0.major && c.version.minor === tls.Versions.TLS_1_0.minor;
  if (tls10) {
    length += 2 * sp.fixed_iv_length;
  }
  var km = prf(sp.master_secret, "key expansion", random, length);
  var rval = {
    client_write_MAC_key: km.getBytes(sp.mac_key_length),
    server_write_MAC_key: km.getBytes(sp.mac_key_length),
    client_write_key: km.getBytes(sp.enc_key_length),
    server_write_key: km.getBytes(sp.enc_key_length)
  };
  if (tls10) {
    rval.client_write_IV = km.getBytes(sp.fixed_iv_length);
    rval.server_write_IV = km.getBytes(sp.fixed_iv_length);
  }
  return rval;
};
tls.createConnectionState = function (c) {
  var client = c.entity === tls.ConnectionEnd.client;
  var createMode = function () {
    var mode = {
      sequenceNumber: [0, 0],
      macKey: null,
      macLength: 0,
      macFunction: null,
      cipherState: null,
      cipherFunction: function (record) {
        return true;
      },
      compressionState: null,
      compressFunction: function (record) {
        return true;
      },
      updateSequenceNumber: function () {
        if (mode.sequenceNumber[1] === 4294967295) {
          mode.sequenceNumber[1] = 0;
          ++mode.sequenceNumber[0];
        } else {
          ++mode.sequenceNumber[1];
        }
      }
    };
    return mode;
  };
  var state = {
    read: createMode(),
    write: createMode()
  };
  state.read.update = function (c, record) {
    if (!state.read.cipherFunction(record, state.read)) {
      c.error(c, {
        message: "Could not decrypt record or bad MAC.",
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.bad_record_mac
        }
      });
    } else if (!state.read.compressFunction(c, record, state.read)) {
      c.error(c, {
        message: "Could not decompress record.",
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.decompression_failure
        }
      });
    }
    return !c.fail;
  };
  state.write.update = function (c, record) {
    if (!state.write.compressFunction(c, record, state.write)) {
      c.error(c, {
        message: "Could not compress record.",
        send: false,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.internal_error
        }
      });
    } else if (!state.write.cipherFunction(record, state.write)) {
      c.error(c, {
        message: "Could not encrypt record.",
        send: false,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.internal_error
        }
      });
    }
    return !c.fail;
  };
  if (c.session) {
    var sp = c.session.sp;
    c.session.cipherSuite.initSecurityParameters(sp);
    sp.keys = tls.generateKeys(c, sp);
    state.read.macKey = client ? sp.keys.server_write_MAC_key : sp.keys.client_write_MAC_key;
    state.write.macKey = client ? sp.keys.client_write_MAC_key : sp.keys.server_write_MAC_key;
    c.session.cipherSuite.initConnectionState(state, c, sp);
    switch (sp.compression_algorithm) {
      case tls.CompressionMethod.none:
        break;
      case tls.CompressionMethod.deflate:
        state.read.compressFunction = inflate;
        state.write.compressFunction = deflate;
        break;
      default:
        throw new Error("Unsupported compression algorithm.");
    }
  }
  return state;
};
tls.createRandom = function () {
  var d = new Date();
  var utc = +d + d.getTimezoneOffset() * 60000;
  var rval = forge.util.createBuffer();
  rval.putInt32(utc);
  rval.putBytes(forge.random.getBytes(28));
  return rval;
};
tls.createRecord = function (c, options) {
  if (!options.data) {
    return null;
  }
  var record = {
    type: options.type,
    version: {
      major: c.version.major,
      minor: c.version.minor
    },
    length: options.data.length(),
    fragment: options.data
  };
  return record;
};
tls.createAlert = function (c, alert) {
  var b = forge.util.createBuffer();
  b.putByte(alert.level);
  b.putByte(alert.description);
  return tls.createRecord(c, {
    type: tls.ContentType.alert,
    data: b
  });
};
tls.createClientHello = function (c) {
  c.session.clientHelloVersion = {
    major: c.version.major,
    minor: c.version.minor
  };
  var cipherSuites = forge.util.createBuffer();
  for (var i = 0; i < c.cipherSuites.length; ++i) {
    var cs = c.cipherSuites[i];
    cipherSuites.putByte(cs.id[0]);
    cipherSuites.putByte(cs.id[1]);
  }
  var cSuites = cipherSuites.length();
  var compressionMethods = forge.util.createBuffer();
  compressionMethods.putByte(tls.CompressionMethod.none);
  var cMethods = compressionMethods.length();
  var extensions = forge.util.createBuffer();
  if (c.virtualHost) {
    var ext = forge.util.createBuffer();
    ext.putByte(0);
    ext.putByte(0);
    var serverName = forge.util.createBuffer();
    serverName.putByte(0);
    writeVector(serverName, 2, forge.util.createBuffer(c.virtualHost));
    var snList = forge.util.createBuffer();
    writeVector(snList, 2, serverName);
    writeVector(ext, 2, snList);
    extensions.putBuffer(ext);
  }
  var extLength = extensions.length();
  if (extLength > 0) {
    extLength += 2;
  }
  var sessionId = c.session.id;
  var length = sessionId.length + 1 + 2 + 4 + 28 + 2 + cSuites + 1 + cMethods + extLength;
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.client_hello);
  rval.putInt24(length);
  rval.putByte(c.version.major);
  rval.putByte(c.version.minor);
  rval.putBytes(c.session.sp.client_random);
  writeVector(rval, 1, forge.util.createBuffer(sessionId));
  writeVector(rval, 2, cipherSuites);
  writeVector(rval, 1, compressionMethods);
  if (extLength > 0) {
    writeVector(rval, 2, extensions);
  }
  return rval;
};
tls.createServerHello = function (c) {
  var sessionId = c.session.id;
  var length = sessionId.length + 1 + 2 + 4 + 28 + 2 + 1;
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.server_hello);
  rval.putInt24(length);
  rval.putByte(c.version.major);
  rval.putByte(c.version.minor);
  rval.putBytes(c.session.sp.server_random);
  writeVector(rval, 1, forge.util.createBuffer(sessionId));
  rval.putByte(c.session.cipherSuite.id[0]);
  rval.putByte(c.session.cipherSuite.id[1]);
  rval.putByte(c.session.compressionMethod);
  return rval;
};
tls.createCertificate = function (c) {
  var client = c.entity === tls.ConnectionEnd.client;
  var cert = null;
  if (c.getCertificate) {
    var hint;
    if (client) {
      hint = c.session.certificateRequest;
    } else {
      hint = c.session.extensions.server_name.serverNameList;
    }
    cert = c.getCertificate(c, hint);
  }
  var certList = forge.util.createBuffer();
  if (cert !== null) {
    try {
      if (!forge.util.isArray(cert)) {
        cert = [cert];
      }
      var asn1 = null;
      for (var i = 0; i < cert.length; ++i) {
        var msg = forge.pem.decode(cert[i])[0];
        if (msg.type !== "CERTIFICATE" && msg.type !== "X509 CERTIFICATE" && msg.type !== "TRUSTED CERTIFICATE") {
          var error = new Error("Could not convert certificate from PEM; PEM " + "header type is not \"CERTIFICATE\", \"X509 CERTIFICATE\", or " + "\"TRUSTED CERTIFICATE\".");
          error.headerType = msg.type;
          throw error;
        }
        if (msg.procType && msg.procType.type === "ENCRYPTED") {
          throw new Error("Could not convert certificate from PEM; PEM is encrypted.");
        }
        var der = forge.util.createBuffer(msg.body);
        if (asn1 === null) {
          asn1 = forge.asn1.fromDer(der.bytes(), false);
        }
        var certBuffer = forge.util.createBuffer();
        writeVector(certBuffer, 3, der);
        certList.putBuffer(certBuffer);
      }
      cert = forge.pki.certificateFromAsn1(asn1);
      if (client) {
        c.session.clientCertificate = cert;
      } else {
        c.session.serverCertificate = cert;
      }
    } catch (ex) {
      return c.error(c, {
        message: "Could not send certificate list.",
        cause: ex,
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.bad_certificate
        }
      });
    }
  }
  var length = 3 + certList.length();
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.certificate);
  rval.putInt24(length);
  writeVector(rval, 3, certList);
  return rval;
};
tls.createClientKeyExchange = function (c) {
  var b = forge.util.createBuffer();
  b.putByte(c.session.clientHelloVersion.major);
  b.putByte(c.session.clientHelloVersion.minor);
  b.putBytes(forge.random.getBytes(46));
  var sp = c.session.sp;
  sp.pre_master_secret = b.getBytes();
  var key = c.session.serverCertificate.publicKey;
  b = key.encrypt(sp.pre_master_secret);
  var length = b.length + 2;
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.client_key_exchange);
  rval.putInt24(length);
  rval.putInt16(b.length);
  rval.putBytes(b);
  return rval;
};
tls.createServerKeyExchange = function (c) {
  var rval = forge.util.createBuffer();
  return rval;
};
tls.getClientSignature = function (c, callback) {
  var b = forge.util.createBuffer();
  b.putBuffer(c.session.md5.digest());
  b.putBuffer(c.session.sha1.digest());
  b = b.getBytes();
  c.getSignature = c.getSignature || (function (c, b, callback) {
    var privateKey = null;
    if (c.getPrivateKey) {
      try {
        privateKey = c.getPrivateKey(c, c.session.clientCertificate);
        privateKey = forge.pki.privateKeyFromPem(privateKey);
      } catch (ex) {
        c.error(c, {
          message: "Could not get private key.",
          cause: ex,
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.internal_error
          }
        });
      }
    }
    if (privateKey === null) {
      c.error(c, {
        message: "No private key set.",
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: tls.Alert.Description.internal_error
        }
      });
    } else {
      b = privateKey.sign(b, null);
    }
    callback(c, b);
  });
  c.getSignature(c, b, callback);
};
tls.createCertificateVerify = function (c, signature) {
  var length = signature.length + 2;
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.certificate_verify);
  rval.putInt24(length);
  rval.putInt16(signature.length);
  rval.putBytes(signature);
  return rval;
};
tls.createCertificateRequest = function (c) {
  var certTypes = forge.util.createBuffer();
  certTypes.putByte(1);
  var cAs = forge.util.createBuffer();
  for (var key in c.caStore.certs) {
    var cert = c.caStore.certs[key];
    var dn = forge.pki.distinguishedNameToAsn1(cert.subject);
    var byteBuffer = forge.asn1.toDer(dn);
    cAs.putInt16(byteBuffer.length());
    cAs.putBuffer(byteBuffer);
  }
  var length = 1 + certTypes.length() + 2 + cAs.length();
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.certificate_request);
  rval.putInt24(length);
  writeVector(rval, 1, certTypes);
  writeVector(rval, 2, cAs);
  return rval;
};
tls.createServerHelloDone = function (c) {
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.server_hello_done);
  rval.putInt24(0);
  return rval;
};
tls.createChangeCipherSpec = function () {
  var rval = forge.util.createBuffer();
  rval.putByte(1);
  return rval;
};
tls.createFinished = function (c) {
  var b = forge.util.createBuffer();
  b.putBuffer(c.session.md5.digest());
  b.putBuffer(c.session.sha1.digest());
  var client = c.entity === tls.ConnectionEnd.client;
  var sp = c.session.sp;
  var vdl = 12;
  var prf = prf_TLS1;
  var label = client ? "client finished" : "server finished";
  b = prf(sp.master_secret, label, b.getBytes(), vdl);
  var rval = forge.util.createBuffer();
  rval.putByte(tls.HandshakeType.finished);
  rval.putInt24(b.length());
  rval.putBuffer(b);
  return rval;
};
tls.createHeartbeat = function (type, payload, payloadLength) {
  if (typeof payloadLength === "undefined") {
    payloadLength = payload.length;
  }
  var rval = forge.util.createBuffer();
  rval.putByte(type);
  rval.putInt16(payloadLength);
  rval.putBytes(payload);
  var plaintextLength = rval.length();
  var paddingLength = Math.max(16, plaintextLength - payloadLength - 3);
  rval.putBytes(forge.random.getBytes(paddingLength));
  return rval;
};
tls.queue = function (c, record) {
  if (!record) {
    return;
  }
  if (record.fragment.length() === 0) {
    if (record.type === tls.ContentType.handshake || record.type === tls.ContentType.alert || record.type === tls.ContentType.change_cipher_spec) {
      return;
    }
  }
  if (record.type === tls.ContentType.handshake) {
    var bytes = record.fragment.bytes();
    c.session.md5.update(bytes);
    c.session.sha1.update(bytes);
    bytes = null;
  }
  var records;
  if (record.fragment.length() <= tls.MaxFragment) {
    records = [record];
  } else {
    records = [];
    var data = record.fragment.bytes();
    while (data.length > tls.MaxFragment) {
      records.push(tls.createRecord(c, {
        type: record.type,
        data: forge.util.createBuffer(data.slice(0, tls.MaxFragment))
      }));
      data = data.slice(tls.MaxFragment);
    }
    if (data.length > 0) {
      records.push(tls.createRecord(c, {
        type: record.type,
        data: forge.util.createBuffer(data)
      }));
    }
  }
  for (var i = 0; i < records.length && !c.fail; ++i) {
    var rec = records[i];
    var s = c.state.current.write;
    if (s.update(c, rec)) {
      c.records.push(rec);
    }
  }
};
tls.flush = function (c) {
  for (var i = 0; i < c.records.length; ++i) {
    var record = c.records[i];
    c.tlsData.putByte(record.type);
    c.tlsData.putByte(record.version.major);
    c.tlsData.putByte(record.version.minor);
    c.tlsData.putInt16(record.fragment.length());
    c.tlsData.putBuffer(c.records[i].fragment);
  }
  c.records = [];
  return c.tlsDataReady(c);
};
var _certErrorToAlertDesc = function (error) {
  switch (error) {
    case true:
      return true;
    case forge.pki.certificateError.bad_certificate:
      return tls.Alert.Description.bad_certificate;
    case forge.pki.certificateError.unsupported_certificate:
      return tls.Alert.Description.unsupported_certificate;
    case forge.pki.certificateError.certificate_revoked:
      return tls.Alert.Description.certificate_revoked;
    case forge.pki.certificateError.certificate_expired:
      return tls.Alert.Description.certificate_expired;
    case forge.pki.certificateError.certificate_unknown:
      return tls.Alert.Description.certificate_unknown;
    case forge.pki.certificateError.unknown_ca:
      return tls.Alert.Description.unknown_ca;
    default:
      return tls.Alert.Description.bad_certificate;
  }
};
var _alertDescToCertError = function (desc) {
  switch (desc) {
    case true:
      return true;
    case tls.Alert.Description.bad_certificate:
      return forge.pki.certificateError.bad_certificate;
    case tls.Alert.Description.unsupported_certificate:
      return forge.pki.certificateError.unsupported_certificate;
    case tls.Alert.Description.certificate_revoked:
      return forge.pki.certificateError.certificate_revoked;
    case tls.Alert.Description.certificate_expired:
      return forge.pki.certificateError.certificate_expired;
    case tls.Alert.Description.certificate_unknown:
      return forge.pki.certificateError.certificate_unknown;
    case tls.Alert.Description.unknown_ca:
      return forge.pki.certificateError.unknown_ca;
    default:
      return forge.pki.certificateError.bad_certificate;
  }
};
tls.verifyCertificateChain = function (c, chain) {
  try {
    forge.pki.verifyCertificateChain(c.caStore, chain, function verify(vfd, depth, chain) {
      var desc = _certErrorToAlertDesc(vfd);
      var ret = c.verify(c, vfd, depth, chain);
      if (ret !== true) {
        if (typeof ret === "object" && !forge.util.isArray(ret)) {
          var error = new Error("The application rejected the certificate.");
          error.send = true;
          error.alert = {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.bad_certificate
          };
          if (ret.message) {
            error.message = ret.message;
          }
          if (ret.alert) {
            error.alert.description = ret.alert;
          }
          throw error;
        }
        if (ret !== vfd) {
          ret = _alertDescToCertError(ret);
        }
      }
      return ret;
    });
  } catch (ex) {
    var err = ex;
    if (typeof err !== "object" || forge.util.isArray(err)) {
      err = {
        send: true,
        alert: {
          level: tls.Alert.Level.fatal,
          description: _certErrorToAlertDesc(ex)
        }
      };
    }
    if (!(("send" in err))) {
      err.send = true;
    }
    if (!(("alert" in err))) {
      err.alert = {
        level: tls.Alert.Level.fatal,
        description: _certErrorToAlertDesc(err.error)
      };
    }
    c.error(c, err);
  }
  return !c.fail;
};
tls.createSessionCache = function (cache, capacity) {
  var rval = null;
  if (cache && cache.getSession && cache.setSession && cache.order) {
    rval = cache;
  } else {
    rval = {};
    rval.cache = cache || ({});
    rval.capacity = Math.max(capacity || 100, 1);
    rval.order = [];
    for (var key in cache) {
      if (rval.order.length <= capacity) {
        rval.order.push(key);
      } else {
        delete cache[key];
      }
    }
    rval.getSession = function (sessionId) {
      var session = null;
      var key = null;
      if (sessionId) {
        key = forge.util.bytesToHex(sessionId);
      } else if (rval.order.length > 0) {
        key = rval.order[0];
      }
      if (key !== null && (key in rval.cache)) {
        session = rval.cache[key];
        delete rval.cache[key];
        for (var i in rval.order) {
          if (rval.order[i] === key) {
            rval.order.splice(i, 1);
            break;
          }
        }
      }
      return session;
    };
    rval.setSession = function (sessionId, session) {
      if (rval.order.length === rval.capacity) {
        var key = rval.order.shift();
        delete rval.cache[key];
      }
      var key = forge.util.bytesToHex(sessionId);
      rval.order.push(key);
      rval.cache[key] = session;
    };
  }
  return rval;
};
tls.createConnection = function (options) {
  var caStore = null;
  if (options.caStore) {
    if (forge.util.isArray(options.caStore)) {
      caStore = forge.pki.createCaStore(options.caStore);
    } else {
      caStore = options.caStore;
    }
  } else {
    caStore = forge.pki.createCaStore();
  }
  var cipherSuites = options.cipherSuites || null;
  if (cipherSuites === null) {
    cipherSuites = [];
    for (var key in tls.CipherSuites) {
      cipherSuites.push(tls.CipherSuites[key]);
    }
  }
  var entity = options.server || false ? tls.ConnectionEnd.server : tls.ConnectionEnd.client;
  var sessionCache = options.sessionCache ? tls.createSessionCache(options.sessionCache) : null;
  var c = {
    version: {
      major: tls.Version.major,
      minor: tls.Version.minor
    },
    entity: entity,
    sessionId: options.sessionId,
    caStore: caStore,
    sessionCache: sessionCache,
    cipherSuites: cipherSuites,
    connected: options.connected,
    virtualHost: options.virtualHost || null,
    verifyClient: options.verifyClient || false,
    verify: options.verify || (function (cn, vfd, dpth, cts) {
      return vfd;
    }),
    getCertificate: options.getCertificate || null,
    getPrivateKey: options.getPrivateKey || null,
    getSignature: options.getSignature || null,
    input: forge.util.createBuffer(),
    tlsData: forge.util.createBuffer(),
    data: forge.util.createBuffer(),
    tlsDataReady: options.tlsDataReady,
    dataReady: options.dataReady,
    heartbeatReceived: options.heartbeatReceived,
    closed: options.closed,
    error: function (c, ex) {
      ex.origin = ex.origin || (c.entity === tls.ConnectionEnd.client ? "client" : "server");
      if (ex.send) {
        tls.queue(c, tls.createAlert(c, ex.alert));
        tls.flush(c);
      }
      var fatal = ex.fatal !== false;
      if (fatal) {
        c.fail = true;
      }
      options.error(c, ex);
      if (fatal) {
        c.close(false);
      }
    },
    deflate: options.deflate || null,
    inflate: options.inflate || null
  };
  c.reset = function (clearFail) {
    c.version = {
      major: tls.Version.major,
      minor: tls.Version.minor
    };
    c.record = null;
    c.session = null;
    c.peerCertificate = null;
    c.state = {
      pending: null,
      current: null
    };
    c.expect = c.entity === tls.ConnectionEnd.client ? SHE : CHE;
    c.fragmented = null;
    c.records = [];
    c.open = false;
    c.handshakes = 0;
    c.handshaking = false;
    c.isConnected = false;
    c.fail = !(clearFail || typeof clearFail === "undefined");
    c.input.clear();
    c.tlsData.clear();
    c.data.clear();
    c.state.current = tls.createConnectionState(c);
  };
  c.reset();
  var _update = function (c, record) {
    var aligned = record.type - tls.ContentType.change_cipher_spec;
    var handlers = ctTable[c.entity][c.expect];
    if ((aligned in handlers)) {
      handlers[aligned](c, record);
    } else {
      tls.handleUnexpected(c, record);
    }
  };
  var _readRecordHeader = function (c) {
    var rval = 0;
    var b = c.input;
    var len = b.length();
    if (len < 5) {
      rval = 5 - len;
    } else {
      c.record = {
        type: b.getByte(),
        version: {
          major: b.getByte(),
          minor: b.getByte()
        },
        length: b.getInt16(),
        fragment: forge.util.createBuffer(),
        ready: false
      };
      var compatibleVersion = c.record.version.major === c.version.major;
      if (compatibleVersion && c.session && c.session.version) {
        compatibleVersion = c.record.version.minor === c.version.minor;
      }
      if (!compatibleVersion) {
        c.error(c, {
          message: "Incompatible TLS version.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.protocol_version
          }
        });
      }
    }
    return rval;
  };
  var _readRecord = function (c) {
    var rval = 0;
    var b = c.input;
    var len = b.length();
    if (len < c.record.length) {
      rval = c.record.length - len;
    } else {
      c.record.fragment.putBytes(b.getBytes(c.record.length));
      b.compact();
      var s = c.state.current.read;
      if (s.update(c, c.record)) {
        if (c.fragmented !== null) {
          if (c.fragmented.type === c.record.type) {
            c.fragmented.fragment.putBuffer(c.record.fragment);
            c.record = c.fragmented;
          } else {
            c.error(c, {
              message: "Invalid fragmented record.",
              send: true,
              alert: {
                level: tls.Alert.Level.fatal,
                description: tls.Alert.Description.unexpected_message
              }
            });
          }
        }
        c.record.ready = true;
      }
    }
    return rval;
  };
  c.handshake = function (sessionId) {
    if (c.entity !== tls.ConnectionEnd.client) {
      c.error(c, {
        message: "Cannot initiate handshake as a server.",
        fatal: false
      });
    } else if (c.handshaking) {
      c.error(c, {
        message: "Handshake already in progress.",
        fatal: false
      });
    } else {
      if (c.fail && !c.open && c.handshakes === 0) {
        c.fail = false;
      }
      c.handshaking = true;
      sessionId = sessionId || "";
      var session = null;
      if (sessionId.length > 0) {
        if (c.sessionCache) {
          session = c.sessionCache.getSession(sessionId);
        }
        if (session === null) {
          sessionId = "";
        }
      }
      if (sessionId.length === 0 && c.sessionCache) {
        session = c.sessionCache.getSession();
        if (session !== null) {
          sessionId = session.id;
        }
      }
      c.session = {
        id: sessionId,
        version: null,
        cipherSuite: null,
        compressionMethod: null,
        serverCertificate: null,
        certificateRequest: null,
        clientCertificate: null,
        sp: {},
        md5: forge.md.md5.create(),
        sha1: forge.md.sha1.create()
      };
      if (session) {
        c.version = session.version;
        c.session.sp = session.sp;
      }
      c.session.sp.client_random = tls.createRandom().getBytes();
      c.open = true;
      tls.queue(c, tls.createRecord(c, {
        type: tls.ContentType.handshake,
        data: tls.createClientHello(c)
      }));
      tls.flush(c);
    }
  };
  c.process = function (data) {
    var rval = 0;
    if (data) {
      c.input.putBytes(data);
    }
    if (!c.fail) {
      if (c.record !== null && c.record.ready && c.record.fragment.isEmpty()) {
        c.record = null;
      }
      if (c.record === null) {
        rval = _readRecordHeader(c);
      }
      if (!c.fail && c.record !== null && !c.record.ready) {
        rval = _readRecord(c);
      }
      if (!c.fail && c.record !== null && c.record.ready) {
        _update(c, c.record);
      }
    }
    return rval;
  };
  c.prepare = function (data) {
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.application_data,
      data: forge.util.createBuffer(data)
    }));
    return tls.flush(c);
  };
  c.prepareHeartbeatRequest = function (payload, payloadLength) {
    if (payload instanceof forge.util.ByteBuffer) {
      payload = payload.bytes();
    }
    if (typeof payloadLength === "undefined") {
      payloadLength = payload.length;
    }
    c.expectedHeartbeatPayload = payload;
    tls.queue(c, tls.createRecord(c, {
      type: tls.ContentType.heartbeat,
      data: tls.createHeartbeat(tls.HeartbeatMessageType.heartbeat_request, payload, payloadLength)
    }));
    return tls.flush(c);
  };
  c.close = function (clearFail) {
    if (!c.fail && c.sessionCache && c.session) {
      var session = {
        id: c.session.id,
        version: c.session.version,
        sp: c.session.sp
      };
      session.sp.keys = null;
      c.sessionCache.setSession(session.id, session);
    }
    if (c.open) {
      c.open = false;
      c.input.clear();
      if (c.isConnected || c.handshaking) {
        c.isConnected = c.handshaking = false;
        tls.queue(c, tls.createAlert(c, {
          level: tls.Alert.Level.warning,
          description: tls.Alert.Description.close_notify
        }));
        tls.flush(c);
      }
      c.closed(c);
    }
    c.reset(clearFail);
  };
  return c;
};
forge.tls = forge.tls || ({});
for (var key in tls) {
  if (typeof tls[key] !== "function") {
    forge.tls[key] = tls[key];
  }
}
forge.tls.prf_tls1 = prf_TLS1;
forge.tls.hmac_sha1 = hmac_sha1;
forge.tls.createSessionCache = tls.createSessionCache;
forge.tls.createConnection = tls.createConnection;

export { forge as default };
