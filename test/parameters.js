var express = require("express");
var app = express();

var Controller = require("../lib/controller.js");

var NodeCtrl = Controller._extend({

  init: function(parent, config) {
    this._super(parent, config);

    this.setParameterNames("add", ["name", "age"]);
  },

  _index_: function(req, res) {
    res.send("Hello Controller!");
  },

  _add_: function(req, res) {
    var msg = "Added user: " + req.param("name") + ", " + req.param("age");
    res.send(msg);
  }
});

var ctrl = new NodeCtrl("root", {exactParNames: true});
app.use(ctrl.middleware());
// or
// ctrl.bind(app);

app.listen(3000);
