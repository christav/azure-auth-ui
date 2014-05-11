//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:createForkModel');
var express = require('express');
var router = express.Router();

var GitHubApi = require('../lib/github');
var githubAccount = require('./githubAccount');
var requiresAuth = require('../lib/requiresAuth');

//
// Make sure user doesn't have a fork - if so redirect to home page
//
function ensureNoFork(req, res, next) {
  req.account.hasOrgRepoFork()
    .then(function (hasRepo) {
      if (hasRepo) {
        res.redirect('/');
      } else {
        next();
      }
    }, function (err) {
        next(err);
      });
}

function createFork(req, res, next) {
  debug('creating fork');
  req.account.createOrgRepoFork()
    .then(function () {
      debug('request to create completed');
      res.redirect('/users/waitforfork');
    }, function (err) {
      next(err);
    });
}

function checkForFork(req, res, next) {
  debug('checking if user has fork');
  req.account.hasOrgRepoFork()
    .then(function (hasRepo) {
      if (hasRepo) {
        debug('user has fork');
        res.redirect('/');
      } else {
        debug('no fork');
        next();
      }
    }, function (err) {
      next(err);
    });
}

var createForkRouter = express.Router();
(function (router) {
  router.use(requiresAuth);
  router.use(GitHubApi.createClient);
  router.use(githubAccount.createAccount);
  router.use(ensureNoFork);
  router.use(createFork);
})(createForkRouter);

var pollForForkRouter = express.Router();

(function (router) {
  router.use(requiresAuth);
  router.use(GitHubApi.createClient);
  router.use(githubAccount.createAccount);
  router.use(checkForFork);
})(pollForForkRouter);

_.extend(exports, {
  createFork: createForkRouter,
  pollForFork: pollForForkRouter
});
