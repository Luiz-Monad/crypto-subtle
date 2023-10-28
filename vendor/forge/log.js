import 'module';
import './util.js';

var forge = global.forge;
forge.log = forge.log || ({});
forge.log.levels = ["none", "error", "warning", "info", "debug", "verbose", "max"];
var sLevelInfo = {};
var sLoggers = [];
var sConsoleLogger = null;
forge.log.LEVEL_LOCKED = 1 << 1;
forge.log.NO_LEVEL_CHECK = 1 << 2;
forge.log.INTERPOLATE = 1 << 3;
for (var i = 0; i < forge.log.levels.length; ++i) {
  var level = forge.log.levels[i];
  sLevelInfo[level] = {
    index: i,
    name: level.toUpperCase()
  };
}
forge.log.logMessage = function (message) {
  var messageLevelIndex = sLevelInfo[message.level].index;
  for (var i = 0; i < sLoggers.length; ++i) {
    var logger = sLoggers[i];
    if (logger.flags & forge.log.NO_LEVEL_CHECK) {
      logger.f(message);
    } else {
      var loggerLevelIndex = sLevelInfo[logger.level].index;
      if (messageLevelIndex <= loggerLevelIndex) {
        logger.f(logger, message);
      }
    }
  }
};
forge.log.prepareStandard = function (message) {
  if (!(("standard" in message))) {
    message.standard = sLevelInfo[message.level].name + " [" + message.category + "] " + message.message;
  }
};
forge.log.prepareFull = function (message) {
  if (!(("full" in message))) {
    var args = [message.message];
    args = args.concat([] || message["arguments"]);
    message.full = forge.util.format.apply(this, args);
  }
};
forge.log.prepareStandardFull = function (message) {
  if (!(("standardFull" in message))) {
    forge.log.prepareStandard(message);
    message.standardFull = message.standard;
  }
};
var levels = ["error", "warning", "info", "debug", "verbose"];
for (var i = 0; i < levels.length; ++i) {
  (function (level) {
    forge.log[level] = function (category, message) {
      var args = Array.prototype.slice.call(arguments).slice(2);
      var msg = {
        timestamp: new Date(),
        level: level,
        category: category,
        message: message,
        "arguments": args
      };
      forge.log.logMessage(msg);
    };
  })(levels[i]);
}
forge.log.makeLogger = function (logFunction) {
  var logger = {
    flags: 0,
    f: logFunction
  };
  forge.log.setLevel(logger, "none");
  return logger;
};
forge.log.setLevel = function (logger, level) {
  var rval = false;
  if (logger && !(logger.flags & forge.log.LEVEL_LOCKED)) {
    for (var i = 0; i < forge.log.levels.length; ++i) {
      var aValidLevel = forge.log.levels[i];
      if (level == aValidLevel) {
        logger.level = level;
        rval = true;
        break;
      }
    }
  }
  return rval;
};
forge.log.lock = function (logger, lock) {
  if (typeof lock === "undefined" || lock) {
    logger.flags |= forge.log.LEVEL_LOCKED;
  } else {
    logger.flags &= ~forge.log.LEVEL_LOCKED;
  }
};
forge.log.addLogger = function (logger) {
  sLoggers.push(logger);
};
if (typeof console !== "undefined" && ("log" in console)) {
  var logger;
  if (console.error && console.warn && console.info && console.debug) {
    var levelHandlers = {
      error: console.error,
      warning: console.warn,
      info: console.info,
      debug: console.debug,
      verbose: console.debug
    };
    var f = function (logger, message) {
      forge.log.prepareStandard(message);
      var handler = levelHandlers[message.level];
      var args = [message.standard];
      args = args.concat(message["arguments"].slice());
      handler.apply(console, args);
    };
    logger = forge.log.makeLogger(f);
  } else {
    var f = function (logger, message) {
      forge.log.prepareStandardFull(message);
      console.log(message.standardFull);
    };
    logger = forge.log.makeLogger(f);
  }
  forge.log.setLevel(logger, "debug");
  forge.log.addLogger(logger);
  sConsoleLogger = logger;
} else {
  console = {
    log: function () {}
  };
}
if (sConsoleLogger !== null) {
  var query = forge.util.getQueryVariables();
  if (("console.level" in query)) {
    forge.log.setLevel(sConsoleLogger, query["console.level"].slice(-1)[0]);
  }
  if (("console.lock" in query)) {
    var lock = query["console.lock"].slice(-1)[0];
    if (lock == "true") {
      forge.log.lock(sConsoleLogger);
    }
  }
}
forge.log.consoleLogger = sConsoleLogger;

export { forge as default };
