var express = require('express');
var passport = require('passport');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

router.get('/login', passport.authenticate('github'));

router.get('/loggedIn',
  passport.authenticate('github', {
    failureRedirect: '/users/login'
  }),
  function (req, res) {
    res.redirect('/');
  });

module.exports = router;
