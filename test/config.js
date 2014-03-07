var express = require("express");
var app = express();

var Controller = require("../lib/controller.js");

var NodeCtrl = Controller._extend({

  init: function(parent, config) {
    this._super(parent, config);
  },

  ___foobar: function(req, res) {
    res.send("Hello Controller!");
  },

  ___test: function(req, res) {
    res.send("Test function");
  }
});

var config = {
  base         : "/foobase/",
  index        : "foobar",
  scheme       : "___%s",
  caseSensitive: false
};

var ctrl = new NodeCtrl("root", config);
app.use(ctrl.middleware());
// or
// ctrl.bind(app);

app.listen(3000);
