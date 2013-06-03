var express = require('express');
var app = express();

var Controller = require('../lib/controller.min');

var NodeCtrl = Controller.extend({

    init: function(parent, config) {
        this._super(parent, config);
    },

    _index_: function(req, res) {
        res.send('Hello Controller!');
    }

});

var ctrl = new NodeCtrl('Root');
ctrl.bind(app);

app.listen(3000);