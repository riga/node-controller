var express = require('express');
var app = express();

var Controller = require('../lib/controller.min');

var NodeCtrl = Controller.extend({

    init: function(parent, config) {
        this._super(parent, config);
    },

    ___foobar: function(req, res) {
        res.send('Hello Controller!');
    },

    ___test: function(req, res) {
        res.send('Test function');
    }

});

var config = {
    index : 'foobar',
    scheme: '___%s'
};

var ctrl = new NodeCtrl('Root', config);
ctrl.bind(app);

app.listen(3000);