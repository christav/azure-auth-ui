var express = require('express');
var router = express.Router();
var util = require('util');

/* GET home page. */
router.get('/', function(req, res) {
  var n = req.session.views || 0;
  req.session.views = n + 1;
  console.log('index page, session =', util.inspect(req.session));
  console.log('index page, user =', req.user);
  res.render('index', { title: 'Express in the hizzouse', n: n, user: req.user });
});

module.exports = router;
