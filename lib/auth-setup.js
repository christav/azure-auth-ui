var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function (username, password, done) {
    if (username === 'chris' && password === 'secret') {
      return done(null, { username: 'chris' });
    }
    return done(null, false, { message: 'Unknown user'});
  }));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

var router = express.Router();

router.use(passport.initialize());
router.use(passport.session());

module.exports = router;
