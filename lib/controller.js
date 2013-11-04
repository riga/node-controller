// load node modules
var util   = require("util");

// load external modules
var extend = require("node.extend");

// load local modules
var Class  = require("./class.min.js");

// the default config
var defaultConfig = {
    base         : "/",
    index        : "index",
    scheme       : "_%s_",
    caseSensitive: true
};

// controller definition, extends Class
var Controller = Class.extend({
    init: function(parent, config) {
        this.parent = parent || "root";
        // extend the config
        this.config = extend({}, defaultConfig, config);

        // parameter names
        this.__parNames = {};
    },

    bind: function(express, base) {
        express.use(this.middleware(base));
        return this;
    },

    middleware: function(base) {
        var self = this;
        // ensure both leading and trailing slash
        base = base || this.config.base;
        base = this.cutSlashes(base, "/", "/");

        var re = new RegExp("^" + this.cutTrainlingSlash(base) + "(|\/|\/.+)$");
        return function(req, res, next) {
            // case in-sensitive?
            if (!self.config.caseSensitive)
                req.url = req._parsedUrl.pathname.toLowerCase() + (req._parsedUrl.search || "");

            // the requested url MUST start with our base
            if (re.test(req.url)) {
                // cut the leading "base" if necessary
                req.url = self.__shiftUrl(req.url, base);
                self.__dispatch(req, res, next);
            } else
                next();
        }
    },

    __dispatch: function(req, res, next) {
        var route = this.__firstRoute(req.url) || this.config.index;
        var handler = this.__handler(route);

        if (this[route] instanceof Controller) {
            req.url = this.__shiftUrl(req.url);
            this[route].__dispatch(req, res, next);
        } else if (this[handler] instanceof Function) {
            // parse further parameters?
            var url = this.cutQuery(req.url);
            if (this.cutSlashes(url) != route) {
                var params = this.cutSlashes(this.__shiftUrl(url, route)).split("/");
                if (params)
                    req.params = this.__parseParams(route, params);
            }
            this[handler](req, res);
        } else
            next();

        return this;
    },

    __handler: function(name) {
        return util.format(this.config.scheme, name);
    },

    __firstRoute: function(url) {
        // cut the query part
        url = this.cutQuery(url);
        // return first routing part
        return this.cutLeadingSlash(url).split("/")[0];
    },

    __shiftUrl: function(url, route) {
        // only do the shift, when the url starts with route
        route = route === undefined ? this.__firstRoute(url) : this.cutSlashes(route);
        if (route) {
            url = this.cutLeadingSlash(url);
            if (url.substr(0, route.length) == route)
                url = url.replace(route, "");
        }
        return this.cutLeadingSlash(url, "/");
    },

    __parseParams: function(route, params) {
        var names = this.__parNames[route] || [];
        var _params = {};
        params.forEach(function(param, i) {
            _params[names[i] || i] = param;
        });
        return _params;
    },

    findRoot: function() {
        var _parent = this.parent;
        while (_parent instanceof Controller)
            _parent = _parent.parent;
        return _parent;
    },

    isRoot: function() {
        return this.findRoot() == this.parent;
    },

    cutTrainlingSlash: function(url, suffix) {
        if (url[url.length -1] == "/")
            url = url.slice(0, -1);
        return url + (suffix || "");
    },

    cutLeadingSlash: function(url, prefix) {
        if (url[0] == "/")
            url = url.slice(1);
        return (prefix || "") + url;
    },

    cutSlashes: function(url, prefix, suffix) {
        return this.cutTrainlingSlash(this.cutLeadingSlash(url, prefix), suffix);
    },

    cutQuery: function(url) {
        return url.split("?")[0];
    },

    __requireMethod: function(req, res, method, statusOrCallback) {
        if (req.method != method) {
            if (statusOrCallback instanceof Function)
                statusOrCallback(req, res);
            else
                res.send(statusOrCallback || 404);
            return false;
        }
        return true;
    },

    requireGET: function(req, res, statusOrCallback) {
        return this.__requireMethod(req, res, "GET", statusOrCallback);
    },

    requirePOST: function(req, res, statusOrCallback) {
        return this.__requireMethod(req, res, "POST", statusOrCallback);
    },

    requirePUT: function(req, res, statusOrCallback) {
        return this.__requireMethod(req, res, "PUT", statusOrCallback);
    },

    setParNames: function(route, names) {
        if (!this[this.__handler(route)] || !names)
            return this;
        if (!(names instanceof Array))
            names = [names];
        // simply store the info
        this.__parNames[route] = names;
        return this;
    }
});


module.exports = Controller;
