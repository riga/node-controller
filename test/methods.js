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
      if (!this.requireGET(req, res))
        return;

      res.send("You called via GET!");
    },

    _post_: function(req, res) {
      if (!this.requirePOST(req, res))
        return;

      res.send("You called via POST!");
    },

    _notput_: function(req, res) {
      if (!this.restrictMethods(req, res, "PUT"))
        return;

      res.send("You didn't call via PUT!");
    }
});

var ctrl = new NodeCtrl("Root");
app.use(ctrl.middleware());
// or
// ctrl.bind(app);

app.listen(3000);