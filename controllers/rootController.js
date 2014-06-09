//
// Controller for the root url. Includes a middleware
// function to load the model from the
// request. Places the model object on req.model.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:rootController');
var express = require('express');
var Q = require('q');
var router = express.Router();
var util = require('util');

var promiseUtils = require('../lib/promise-utils');
var routeResult = require('../lib/routeResult');
var sfmt = require('../lib/sfmt');
var githubAccount = require('../models/githubAccount');

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

function isAuthorized(req) {
  return req.model.authorized;
}

//
// Third step - does this user have access to the
// master auth repo? Try to get the repo information
// - if it fails with a 404 this user doesn't have
// access.
//
function checkAccess(req, res) {
  return Q(false)
    .then(function () {
      debug('Checking access');
      if (!req.account) {
        debug('no account model');
        return;
      }

      req.model.repoAccess = false;

      return req.account.hasOrgAccess()
        .then(function (hasAccess) {
          req.model.repoAccess = hasAccess;
        },
        function (err) {
          req.model.error = 'Could not access github, error = ' + JSON.parse(err.message).message;
        });
    });
}

//
// Fourth step - does this user already have a fork
// of the master auth repo?
//
function checkForFork(req, res) {
  debug('checking for fork');
  req.model.hasFork = false;

  return req.account.hasOrgRepoFork()
    .then(function (hasFork) {
      req.model.hasFork = hasFork;
    },
    function (err) {
      req.model.error = 'Could not access github, error = ' + JSON.parse(err.message).message;
    });
}

//
// Load any current open PRs against the master Repo.
//
function getOpenPrs(req, res) {
  debug('looking for open pull requests');
  req.model.activePrs = [];

  return Q.promise(function (resolve, reject) {
    req.account.getOpenPullRequests()
      .subscribe(
        function onNext(pullRequest) {
          debug(sfmt('got pull request'));
          req.model.activePrs.push({
            number: pullRequest.number,
            url: pullRequest.html_url,
            title: pullRequest.title,
            body: pullRequest.body,
            createdOn: new Date(pullRequest.created_at)
          });
        },
        function onError(err) {
          debug(sfmt('Error reading pull requests: %{0:i}', err));
          reject(err);
        },
        function onComplete() {
          debug('Finished reading open PRs');
          resolve();
        }
      );
  });
}

function setResult(req, res, next) {
  req.result = routeResult.render('index', req.model);
  next();
}

//
// We use a router to compose our steps
// into a single piece of middleware
//
router.use(checkAuthorization);
router.use(githubAccount.createAccount);
router.usePromiseIf(isAuthorized, checkAccess);
router.usePromiseIf(function (req) { return req.model.repoAccess; }, checkForFork);
router.usePromiseIf(isAuthorized, getOpenPrs);
router.use(setResult);

module.exports.get = router;
