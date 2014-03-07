var express = require("express");
var app = express();

var Controller = require("../lib/controller.js");

var NodeCtrl = Controller._extend({

  init: function(parent, config) {
    this._super(parent, config);
  },

  _index_: function(req, res) {
    res.send("Hello Controller!");
  },

  _simplefail_: function(req, res) {
    console.log("simple fail triggered");
    // throw 404;
    // throw {status: 404, err: "there was an error"};
    throw new Error("nope!");
  },

  _complexfail_: function(req, res) {
    console.log("complex fail triggered");
    setTimeout(function() {
      throw 404;
    }, 1000);
  },

  _emitterfail_: function(req, res) {
    var self = this;

    console.log("emitter fail triggered");
    setTimeout(function() {
      self.emit("error", 403);
    }, 1000);
  }
});

var ctrl = new NodeCtrl();
app.use(ctrl.middleware());
// or
// ctrl.bind(app);

app.listen(3000);
