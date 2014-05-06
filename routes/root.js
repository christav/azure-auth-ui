var express = require('express');
var router = express.Router();
var util = require('util');

/* GET home page. */
router.get('/', function(req, res) {
  var n = req.session.views || 0;
  req.session.views = n + 1;
  console.log('user =', util.inspect(req.user));
  res.render('index', { title: 'Express in the hizzouse', n: n, user: req.user });
});

module.exports = router;
