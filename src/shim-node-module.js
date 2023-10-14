const expandoObject = new Proxy({}, {
    get(target, property) {
        if (!(property in target)) {
            target[property] = {};
        }
        return target[property];
    },
    set(target, property, value) {
        target[property] = value;
        return true;
    },
});

global.forge = expandoObject;

module.exports = {
}