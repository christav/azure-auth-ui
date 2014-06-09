'use strict';

var express = require('express');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var util = require('util');

passport.use(new GitHubStrategy({
  clientID: 'cb98336a50132b4900c6',
  clientSecret: process.env.AZURE_AUTH_UI_CLIENT_SECRET,
  callbackURL: 'http://azuregithubauth.azurewebsites.net/auth/loggedIn',
  scope: [ 'user', 'repo' ],
  userAgent: 'azure-auth-ui'
}, function (accessToken, refreshToken, profile, done) {
  return done(null, {
    username: profile.username,
    displayname: profile.displayName,
    accessToken: accessToken
  });
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
