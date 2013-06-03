var util   = require('util'),
    Class  = require('./class.min'),
    extend = require('./extend.min');

var defaultConfig = {
    index : 'index',
    scheme: '_%s_',
};

var Controller = Class.extend({

    init: function(parent, config) {
        this.parent = parent || 'root';
        // extend the config
        this.config = extend({}, defaultConfig, config);
    },

    bind: function(express, base) {
        var self = this;
        base = base || '/';
        express.all('/*', function(req, res, next) {
            // the requested url MUST start with our base
            var re = new RegExp('^' + self.cutTrainlingSlash(base) + '\/?');
            if (re.test(req.url)) {
                // cut the leading 'base' if necessary
                req.url = self.__shiftUrl(req.url, base);
                self.__dispatch(req, res, next);
            } else {
                next();
            }
        });
        return this;
    },

    __dispatch: function(req, res, next) {
        var route = this.__firstRoute(req.url) || this.config.index;
        var handler = this.__handler(route);

        if (this[route] instanceof Controller) {
            req.url = this.__shiftUrl(req.url);
            this[route].__dispatch(req, res, next);
        } else if (this[handler] instanceof Function) {
            this[handler](req, res);
        } else {
            next();
        }
        return this;
    },

    __handler: function(name) {
        return util.format(this.config.scheme, name);
    },

    __firstRoute: function(url) {
        var matches = url.match(/^\/?([^\/]+).*$/);
        return matches ? matches[1] : '';
    },

    __shiftUrl: function(url, route) {
        route = route === undefined ? this.__firstRoute(url) : this.cutSlashes(route);
        var url = !route ? url : url.replace(new RegExp('^\/?' + route), '');
        return url || '/';
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

    cutTrainlingSlash: function(url, postfix) {
        var matches = url.match(/^(.*)\/+$/) || url.match(/^(.*)$/);
        return (matches ? matches[1] : '') + (postfix || '');
    },

    cutLeadingSlash: function(url, prefix) {
        var matches = url.match(/^\/+(.*)$/) || url.match(/^(.*)$/);
        return (prefix || '') + (matches ? matches[1] : '');
    },

    cutSlashes: function(url, prefix, postfix) {
        return this.cutTrainlingSlash(this.cutLeadingSlash(url, prefix), postfix);
    }
});

module.exports = Controller;
