//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

'use strict';

var _ = require('lodash');
var express = require('express');
var router = express.Router();

var GitHubApi = require('../lib/github');

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
// Second step - create a github API client object
// with the user's access token, and tack it on
// the req object for later use.
//
function createGithubClient(req, res, next) {
  console.log('creating github client')
  if (!req.user) {
    return next();
  }

  req.github = new GitHubApi(req.user.accessToken);
  next();
}

//
// Third step - does this user have access to the
// master auth repo? Try to get the repo information
// - if it fails with a 404 this user doesn't have
// access.
//
function checkAccess(req, res, next) {
  console.log('Checking access');
  if (!req.github) {
    return next();
  }

  req.github.get('repos.get', masterRepo)
    .then(function (repo) {
      req.model.repoAccess = true;
    }, function (err) {
      if (err.code !== 404) {
        req.model.error = 'Could not access github, error = ' + JSON.parse(err.message).message;
      } else {
        req.model.repoAccess = false;
      }
    })
    .finally(function () {
      next();
    });
}

//
// Fourth step - does this user already have a fork
// of the master auth repo?
//
function checkForFork(req, res, next) {
  console.log('checking for fork');
  req.model.hasFork = false;

  if (!req.model.repoAccess) {
    return next();
  }

  req.github.list('repos.getForks', masterRepo)
    .firstOrDefault(function (fork) {
      return fork.owner.login === req.user.username;
    })
    .subscribe(
      function onNext(fork) {
        if (fork !== null) {
          req.model.hasFork = true;
        }
      },
      function onError(err) {
        req.model.error = 'Error accessing github: ' + JSON.parse(err.message).message;
        next();
      },
      function onCompleted() {
        next();
      }
    );
}

//
// We use a router to compose our steps
// into a single piece of middleware
//
router.use(checkAuthorization);
router.use(createGithubClient);
router.use(checkAccess);
router.use(checkForFork);

module.exports = router;
