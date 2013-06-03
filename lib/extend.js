// a simple 'extend' function for objects
module.exports = function(target) {
    delete arguments[0];
    for (var i in arguments) {
        var obj = arguments[i];
        for (var key in obj) {
            target[key] = obj[key];
        }
    }
    return target;
};
