var express = require("express");
var app = express();

var Controller = require("../lib/controller.js");

var NodeCtrl = Controller._extend({

  init: function(parent, config) {
    this._super(parent, config);
  },

  _index_: function(req, res) {
    res.send("Hello Controller!");
  }
});

var ctrl = new NodeCtrl();
app.use(ctrl.middleware());
// or
// ctrl.bind(app);

app.listen(3000);
