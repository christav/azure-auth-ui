var express = require('express');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var util = require('util');

passport.use(new GitHubStrategy({
  clientID: 'cb98336a50132b4900c6',
  clientSecret: process.env.AZURE_AUTH_UI_CLIENT_SECRET,
  callbackURL: 'http://127.0.0.1:3000/users/loggedIn',
  scope: [ 'user', 'repo' ],
  userAgent: 'azure-auth-ui'
}, function (accessToken, refreshToken, profile, done) {
  console.log('Github strategy verifier, profile =', util.inspect(profile));
  return done(null, profile);
}));

passport.serializeUser(function (user, done) {
  console.log('serializing user, user =', util.inspect(user));
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  console.log('deserializing user, user =', util.inspect(user));
  done(null, user);
});

var router = express.Router();

router.use(passport.initialize());
router.use(passport.session());

module.exports = router;
