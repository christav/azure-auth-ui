'use strict';

var debug = require('debug')('azure-auth-ui:auth-setup');
var express = require('express');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var util = require('util');

var requiredEnvVars = [
  'AZURE_AUTH_UI_CLIENT_ID',
  'AZURE_AUTH_UI_CLIENT_SECRET',
  'AZURE_AUTH_UI_CALLBACK_URL'
];

var missingEnvVars = requiredEnvVars.map(function (envVar) {
  if (!process.env[envVar]) {
    return envVar;
  }
  return null;
})
.filter(function (envVar) {
  return envVar !== null;
});

if (missingEnvVars.length > 0) {
  debug('Required env vars not set: ' + missingEnvVars.join(', '));
  throw new Error('Missing environment variables: ' + missingEnvVars.join(', '));
}

passport.use(new GitHubStrategy({
  clientID: process.env.AZURE_AUTH_UI_CLIENT_ID,
  clientSecret: process.env.AZURE_AUTH_UI_CLIENT_SECRET,
  callbackURL: process.env.AZURE_AUTH_UI_CALLBACK_URL,
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
