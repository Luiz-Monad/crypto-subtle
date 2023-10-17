import 'module';

var forge = global.forge;
forge.debug = forge.debug || ({});
forge.debug.storage = {};
forge.debug.get = function (cat, name) {
  var rval;
  if (typeof cat === "undefined") {
    rval = forge.debug.storage;
  } else if ((cat in forge.debug.storage)) {
    if (typeof name === "undefined") {
      rval = forge.debug.storage[cat];
    } else {
      rval = forge.debug.storage[cat][name];
    }
  }
  return rval;
};
forge.debug.set = function (cat, name, data) {
  if (!((cat in forge.debug.storage))) {
    forge.debug.storage[cat] = {};
  }
  forge.debug.storage[cat][name] = data;
};
forge.debug.clear = function (cat, name) {
  if (typeof cat === "undefined") {
    forge.debug.storage = {};
  } else if ((cat in forge.debug.storage)) {
    if (typeof name === "undefined") {
      delete forge.debug.storage[cat];
    } else {
      delete forge.debug.storage[cat][name];
    }
  }
};

export { forge as default };
