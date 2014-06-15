//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:createForkController');
var express = require('express');
var router = express.Router();

var middlewareify = require('../lib/promise-utils').middlewareify;
var githubAccount = require('../models/githubAccount');
var requiresAuth = require('../lib/requiresAuth');

//
// Make sure user doesn't have a fork - if so redirect to home page
//
function ensureNoFork(req, res) {
  return req.account.hasOrgRepoFork()
    .then(function (hasRepo) {
      if (hasRepo) {
        res.redirect('/');
        return true;
      }
    });
}

function createFork(req, res) {
  debug('creating fork');
  return req.account.createOrgRepoFork()
    .then(function () {
      debug('request to create completed');
      res.redirect('/users/waitforfork');
      return true;
    });
}

function checkForFork(req, res) {
  debug('checking if user has fork');
  return req.account.hasOrgRepoFork()
    .then(function (hasRepo) {
      if (hasRepo) {
        debug('user has fork');
        res.redirect('/');
        return true;
      } else {
        debug('no fork');
      }
    });
}

var createForkRouter = express.Router();
(function (router) {
  router.use(requiresAuth);
  router.use(githubAccount.createAccount);
  router.use(middlewareify(ensureNoFork));
  router.use(middlewareify(createFork));
})(createForkRouter);

var pollForForkRouter = express.Router();

(function (router) {
  router.use(requiresAuth);
  router.use(githubAccount.createAccount);
  router.use(middlewareify(checkForFork));
})(pollForForkRouter);

_.extend(exports, {
  createFork: createForkRouter,
  pollForFork: pollForForkRouter
});
