//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:rootModel');
var express = require('express');
var router = express.Router();
var util = require('util');

var GitHubApi = require('../lib/github');
var githubAccount = require('./githubAccount');

var masterRepo = {
  user: 'Azure',
  repo: 'azure-github-organization'
};

//
// First step of building our model -
// is the user authenticated?
//
function checkAuthorization(req, res, next) {
  if (!req.user) {
    req.model = { authorized: false };
  } else {
    req.model = {
      authorized: true,
      username: req.user.username,
      displayName: req.user.displayname
    };
  }
  next();
}

//
// Third step - does this user have access to the
// master auth repo? Try to get the repo information
// - if it fails with a 404 this user doesn't have
// access.
//
function checkAccess(req, res, next) {
  debug('Checking access');
  if (!req.account) {
    return next();
  }

  req.model.repoAccess = false;

  req.account.hasOrgAccess()
    .then(function (hasAccess) {
      req.model.repoAccess = hasAccess;
    },
    function (err) {
      req.model.error = 'Could not access github, error = ' + JSON.parse(err.message).message;
    })
    .finally(function() {
      next();
    });
}

//
// Fourth step - does this user already have a fork
// of the master auth repo?
//
function checkForFork(req, res, next) {
  debug('checking for fork');
  req.model.hasFork = false;

  if (!req.model.repoAccess) {
    return next();
  }

  req.account.hasOrgRepoFork()
    .then(function (hasFork) {
      req.model.hasFork = hasFork;
    },
    function (err) {
      req.model.error = 'Could not access github, error = ' + JSON.parse(err.message).message;
    })
    .finally(function() {
      next();
    });
}

//
// We use a router to compose our steps
// into a single piece of middleware
//
router.use(checkAuthorization);
router.use(GitHubApi.createClient);
router.use(githubAccount.createAccount);
router.use(checkAccess);
router.use(checkForFork);

module.exports = router;
