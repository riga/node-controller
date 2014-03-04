/*!
 * node-controller module v0.1.3
 * https://github.com/riga/node-controller
 *
 * Marcel Rieger, 2014
 * Dual licensed under the MIT or GPL Version 3 licenses.
 * http://www.opensource.org/licenses/mit-license
 * http://www.opensource.org/licenses/GPL-3.0
 *
 * A lightweight, single-file Controller approach for node/express.
 */

// load node modules
var util = require("util");

// load npm modules
var extend = require("node.extend"),
    Class  = require("node-oo");

// the default config
var defaultConfig = {
  base         : "/",
  index        : "index",
  scheme       : "_%s_",
  caseSensitive: true
};


// controller definition
var Controller = Class._extend({
  // instance members

  init: function(parent, config) {
    this.parent = parent || "root";

    // extend the config
    this.config = extend({}, defaultConfig, config);

    // parameter names for different routes
    // e.g. for "index" -> ["foo", "bar"], the call to index/what/up
    // is parsed as {foo: "what", bar: "up"}
    this.__parNames = {};
  },

  bind: function(express, base) {
    express.use(this.middleware(base));
    return this;
  },

  middleware: function(base) {
    var self = this;
    // ensure both leading and trailing slash
    if (base == null)
      base = this.config.base;
    base = this._class.cutSlashes(base, "/", "/");

    var re = new RegExp("^" + this._class.cutTrainlingSlash(base) + "(|\/|\/.+)$");
    return function(req, res, next) {
      // case in-sensitive?
      if (!self.config.caseSensitive)
        req.url = req._parsedUrl.pathname.toLowerCase() + (req._parsedUrl.search || "");

      // the requested url MUST start with our base
      if (re.test(req.url)) {
        // cut the leading "base" if necessary
        req.url = self._class.shiftUrl(req.url, base);
        self.__dispatch(req, res, next);
      } else
        next();
    }
  },

  __dispatch: function(req, res, next) {
    var route = this._class.firstRoute(req.url) || this.config.index;
    var handler = this.__handler(route);

    if (this[route] instanceof Controller) {
      req.url = this._class.shiftUrl(req.url);
      this[route].__dispatch(req, res, next);
    } else if (this[handler] instanceof Function) {
      // parse further parameters?
      var url = this._class.cutQuery(req.url);
      if (this._class.cutSlashes(url) != route) {
        var params = this._class.cutSlashes(this._class.shiftUrl(url, route)).split("/");
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

  setParNames: function(route, names) {
    if (!this[this.__handler(route)] || !names)
      return this;
    if (!(names instanceof Array))
      names = [names];
    // simply store the info
    this.__parNames[route] = names;
    return this;
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

  restrictMethods: function(req, res, methods, statusOrCallback) {
    if (!Array.isArray(methods))
      methods = [methods];
    if (~methods.indexOf(req.method)) {
      if (statusOrCallback instanceof Function)
        statusOrCallback(req, res);
      else
        res.send(statusOrCallback || 404);
      return false;
    }
    return true;
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
  }
}, {
  // class members

  firstRoute: function(url) {
    // cut the query part
    url = this.cutQuery(url);
    // return first routing part
    return this.cutLeadingSlash(url).split("/")[0];
  },

  shiftUrl: function(url, route) {
    // only do the shift, when the url starts with route
    route = route === undefined ? this.firstRoute(url) : this.cutSlashes(route);
    if (route) {
      url = this.cutLeadingSlash(url);
      if (url.substr(0, route.length) == route)
        url = url.replace(route, "");
    }
    return this.cutLeadingSlash(url, "/");
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
  }
});


module.exports = Controller;
