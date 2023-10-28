import 'module';
import './util.js';

var forge = global.forge;
var pem = forge.pem = forge.pem || ({});
pem.encode = function (msg, options) {
  options = options || ({});
  var rval = "-----BEGIN " + msg.type + "-----\r\n";
  var header;
  if (msg.procType) {
    header = {
      name: "Proc-Type",
      values: [String(msg.procType.version), msg.procType.type]
    };
    rval += foldHeader(header);
  }
  if (msg.contentDomain) {
    header = {
      name: "Content-Domain",
      values: [msg.contentDomain]
    };
    rval += foldHeader(header);
  }
  if (msg.dekInfo) {
    header = {
      name: "DEK-Info",
      values: [msg.dekInfo.algorithm]
    };
    if (msg.dekInfo.parameters) {
      header.values.push(msg.dekInfo.parameters);
    }
    rval += foldHeader(header);
  }
  if (msg.headers) {
    for (var i = 0; i < msg.headers.length; ++i) {
      rval += foldHeader(msg.headers[i]);
    }
  }
  if (msg.procType) {
    rval += "\r\n";
  }
  rval += forge.util.encode64(msg.body, options.maxline || 64) + "\r\n";
  rval += "-----END " + msg.type + "-----\r\n";
  return rval;
};
pem.decode = function (str) {
  var rval = [];
  var rMessage = /\s*-----BEGIN ([A-Z0-9- ]+)-----\r?\n?([\x21-\x7e\s]+?(?:\r?\n\r?\n))?([:A-Za-z0-9+\/=\s]+?)-----END \1-----/g;
  var rHeader = /([\x21-\x7e]+):\s*([\x21-\x7e\s^:]+)/;
  var rCRLF = /\r?\n/;
  var match;
  while (true) {
    match = rMessage.exec(str);
    if (!match) {
      break;
    }
    var msg = {
      type: match[1],
      procType: null,
      contentDomain: null,
      dekInfo: null,
      headers: [],
      body: forge.util.decode64(match[3])
    };
    rval.push(msg);
    if (!match[2]) {
      continue;
    }
    var lines = match[2].split(rCRLF);
    var li = 0;
    while (match && li < lines.length) {
      var line = lines[li].replace(/\s+$/, "");
      for (var nl = li + 1; nl < lines.length; ++nl) {
        var next = lines[nl];
        if (!(/\s/).test(next[0])) {
          break;
        }
        line += next;
        li = nl;
      }
      match = line.match(rHeader);
      if (match) {
        var header = {
          name: match[1],
          values: []
        };
        var values = match[2].split(",");
        for (var vi = 0; vi < values.length; ++vi) {
          header.values.push(ltrim(values[vi]));
        }
        if (!msg.procType) {
          if (header.name !== "Proc-Type") {
            throw new Error("Invalid PEM formatted message. The first " + "encapsulated header must be \"Proc-Type\".");
          } else if (header.values.length !== 2) {
            throw new Error("Invalid PEM formatted message. The \"Proc-Type\" " + "header must have two subfields.");
          }
          msg.procType = {
            version: values[0],
            type: values[1]
          };
        } else if (!msg.contentDomain && header.name === "Content-Domain") {
          msg.contentDomain = values[0] || "";
        } else if (!msg.dekInfo && header.name === "DEK-Info") {
          if (header.values.length === 0) {
            throw new Error("Invalid PEM formatted message. The \"DEK-Info\" " + "header must have at least one subfield.");
          }
          msg.dekInfo = {
            algorithm: values[0],
            parameters: values[1] || null
          };
        } else {
          msg.headers.push(header);
        }
      }
      ++li;
    }
    if (msg.procType === "ENCRYPTED" && !msg.dekInfo) {
      throw new Error("Invalid PEM formatted message. The \"DEK-Info\" " + "header must be present if \"Proc-Type\" is \"ENCRYPTED\".");
    }
  }
  if (rval.length === 0) {
    throw new Error("Invalid PEM formatted message.");
  }
  return rval;
};
function foldHeader(header) {
  var rval = header.name + ": ";
  var values = [];
  var insertSpace = function (match, $1) {
    return " " + $1;
  };
  for (var i = 0; i < header.values.length; ++i) {
    values.push(header.values[i].replace(/^(\S+\r\n)/, insertSpace));
  }
  rval += values.join(",") + "\r\n";
  var length = 0;
  var candidate = -1;
  for (var i = 0; i < rval.length; (++i, ++length)) {
    if (length > 65 && candidate !== -1) {
      var insert = rval[candidate];
      if (insert === ",") {
        ++candidate;
        rval = rval.substr(0, candidate) + "\r\n " + rval.substr(candidate);
      } else {
        rval = rval.substr(0, candidate) + "\r\n" + insert + rval.substr(candidate + 1);
      }
      length = i - candidate - 1;
      candidate = -1;
      ++i;
    } else if (rval[i] === " " || rval[i] === "\t" || rval[i] === ",") {
      candidate = i;
    }
  }
  return rval;
}
function ltrim(str) {
  return str.replace(/^\s+/, "");
}

export { forge as default };
