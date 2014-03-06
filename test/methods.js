var express = require("express");
var app = express();

var Controller = require("../lib/controller.js");

var NodeCtrl = Controller._extend({

    init: function(parent, config) {
        this._super(parent, config);
    },

    _index_: function(req, res) {
        res.send("Hello Controller!");
    },

    _get_: function(req, res) {
      this.requireGET(req, res);

      res.send("You called via GET!");
    },

    _post_: function(req, res) {
      this.requirePOST(req, res);

      res.send("You called via POST!");
    },

    _notput_: function(req, res) {
      this.restrictMethod(req, res, "PUT");

      res.send("You didn't call via PUT!");
    }
});

var ctrl = new NodeCtrl("root");
app.use(ctrl.middleware());
// or
// ctrl.bind(app);

app.listen(3000);
