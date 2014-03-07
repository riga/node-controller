/*!
 * node-controller module v0.2.2
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
  base           : "/",
  index          : "index",
  scheme         : "_%s_",
  caseSensitive  : true,
  exactParameters: true
};

var multiRe = /\/{2,}/g;


// controller definition
var Controller = Class._extend({
  // instance members

  init: function(parent, config) {
    this.parent = parent || "root";

    // extend the config
    this.config = extend({}, defaultConfig, config);

    // prepare the base
    this.config.base = "/" + this._class.cutSlashes(this.config.base) + "/";
    this.config.base = this.config.base.replace(multiRe, "/");

    // parameter name mapping for different routes
    // e.g. for "index" -> ["foo", "bar"], the call to index/what/up
    // is parsed as {foo: "what", bar: "up"}
    this.__parMap = {};
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

  bind: function(express) {
    express.use(this.middleware());
    return this;
  },

  middleware: function() {
    var self = this;

    base = this.config.base;
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
    } else if (this[handler] instanceof Function && this.__parse(req, res, route, handler)) {
      // call the handler
      try {
        this[handler](req, res);
      } catch (err) {
        var code = parseInt(err);
        code = isNaN(code) ? 500 : code;
        try {
          res.send(code);
        } catch (_) {
        }
      }
    } else
      next();

    return this;
  },

  __handler: function(name) {
    return util.format(this.config.scheme, name);
  },

  __parse: function(req, res, route, handler) {
    var url = this._class.cutQuery(this._class.cutSlashes(req.url));
    req.params = req.params || {};

    // parse further parameters? e.g <route>/foo/bar
    var parNames = this.__parMap[route];
    if (url != route && parNames) {
      var params = this._class.cutSlashes(this._class.shiftUrl(url, route)).split("/");

      if (this.config.exactParameters && params.length != parNames.length)
        return false;

      params.forEach(function(param, i) {
        req.params[parNames[i] || i] = param;
      });
    }

    return this;
  },

  setParameters: function(route, names) {
    var self = this;

    if (route instanceof Object && names == null) {
      Object.keys(route).forEach(function(_route) {
        self.setParameters(_route, route[_route]);
      });
      return this;
    }

    if (!this[this.__handler(route)] || !names)
      return this;
    if (!(names instanceof Array))
      names = [names];
    // simply store the info
    this.__parMap[route] = names;

    return this;
  },

  join: function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.config.base);
    var url = args.join("/").replace(multiRe, "/");
    return "/" + this._class.cutSlashes(url);
  },

  restrictMethod: function(req, res, methods, callback) {
    if (!(methods instanceof Array))
      methods = [methods];
    if (~methods.indexOf(req.method)) {
      if (callback instanceof Function)
        callback(req, res, methods);
      throw 405;
    }
    return this;
  },

  requireMethod: function(req, res, methods, callback) {
    if (!(methods instanceof Array))
      methods = [methods];
    if (!~methods.indexOf(req.method)) {
      if (callback instanceof Function)
        callback(req, res, methods);
      throw 405;
    }
    return this;
  },

  requireOPTIONS: function(req, res, callback) {
    return this.requireMethod(req, res, ["OPTIONS"], callback);
  },

  requireGET: function(req, res, callback) {
    return this.requireMethod(req, res, ["GET"], callback);
  },

  requireHEAD: function(req, res, callback) {
    return this.requireMethod(req, res, ["HEAD"], callback);
  },

  requirePOST: function(req, res, callback) {
    return this.requireMethod(req, res, ["POST"], callback);
  },

  requirePUT: function(req, res, callback) {
    return this.requireMethod(req, res, ["PUT"], callback);
  },

  requireDELETE: function(req, res, callback) {
    return this.requireMethod(req, res, ["DELETE"], callback);
  },

  requireTRACE: function(req, res, callback) {
    return this.requireMethod(req, res, ["TRACE"], callback);
  },

  requireCONNECT: function(req, res, callback) {
    return this.requireMethod(req, res, ["CONNECT"], callback);
  }
}, {
  // class members

  firstRoute: function(url) {
    // /some/url/test -> some
    // cut the query part
    url = this.cutQuery(url);
    // return first routing part
    return this.cutLeadingSlash(url).split("/")[0];
  },

  shiftUrl: function(url, route) {
    // /some/url/test -> url/test
    route = route == null ? this.firstRoute(url) : this.cutSlashes(route);
    if (route) {
      url = this.cutLeadingSlash(url);
      // only do the shift, when the url starts with route
      if (url.substr(0, route.length) == route)
        url = url.slice(route.length);
    }
    return this.cutLeadingSlash(url);
  },

  cutTrainlingSlash: function(url) {
    // some/url/ -> some/url
    if (url[url.length -1] == "/")
      url = url.slice(0, -1);
    return url;
  },

  cutLeadingSlash: function(url) {
    // /some/url -> some/url
    if (url[0] == "/")
      url = url.slice(1);
    return url;
  },

  cutSlashes: function(url) {
    // /some/url/ -> some/url
    return this.cutTrainlingSlash(this.cutLeadingSlash(url));
  },

  cutQuery: function(url) {
    // some/url?foo=bar -> some/url
    return url.split("?")[0];
  }
});


module.exports = Controller;
