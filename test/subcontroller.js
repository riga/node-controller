var express = require('express');
var app = express();

var Controller = require('../lib/controller.min');

var NodeCtrl = Controller.extend({

    init: function(parent, config) {
        this._super(parent, config);

        this.sub = new SubCtrl(this, config);
    },

    _index_: function(req, res) {
        res.send('Hello Controller!');
    }

});

var SubCtrl = Controller.extend({

    init: function(parent, config) {
        this._super(parent, config);
    },

    _index_: function(req, res) {
        res.send('Sub index called!');
    }
});

var ctrl = new NodeCtrl('Root');
ctrl.bind(app);
// or
// app.use(ctrl.middleware());

app.listen(3000);
