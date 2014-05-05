var express = require('express');
var passport = require('passport');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

router.get('/login', function (req, res) {
  res.render('login', { messages: req.flash('error')});
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true})
);

module.exports = router;
