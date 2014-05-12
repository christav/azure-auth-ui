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
    debug('user is not logged in');
    req.model = { authorized: false };
  } else {
    debug('user is logged in');
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
    debug('no account model');
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
    debug('no repo access');
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
// And finally - download the org data and pull out the organizations
//

function downloadOrgData(req, res, next) {
  if (!req.model.repoAccess) {
    return next();
  }

  req.account.getOrgFile()
    .then(function (content) {
      debug('received content');

      req.model.content_sha = content.sha;
      if (content.content) {
        debug('has valid content');
        req.model.organizations =
          _.chain(content.content.organizations)
            .keys()
            .map(function (key) { return content.content.organizations[key]; })
            .pluck('name')
            .sortBy()
            .value();
      } else {
        debug('content has error ' + content.error);
        req.model.error = content.error;
      }
      next();
    }, function (err) {
      debug('error occurred while downloading');
      next(err);
    });
}

//
// We use a router to compose our steps
// into a single piece of middleware
//
router.use(checkAuthorization);
router.use(githubAccount.createAccount);
router.use(checkAccess);
router.use(checkForFork);

module.exports = router;
