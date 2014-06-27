//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:createForkController');
var express = require('express');
var path = require('path');
var router = express.Router();

var githubAccount = require('../../models/githubAccount');
var requiresAuth = require('../../lib/requiresAuth');
var routeResult = require('../../lib/routeResult');

//
// Make sure user doesn't have a fork - if so redirect to home page
//
function ensureNoFork(req, res) {
  return req.account.hasOrgRepoFork()
    .then(function (hasRepo) {
      if (hasRepo) {
        req.result = routeResult.redirect('/');
      }
    });
}

function createFork(req, res) {
  debug('creating fork');
  return req.account.createOrgRepoFork()
    .then(function () {
      debug('request to create completed');
      req.result = routeResult.redirect('/users/waitforfork');
    });
}

function checkForFork(req, res) {
  debug('checking if user has fork');
  return req.account.hasOrgRepoFork()
    .then(function (hasRepo) {
      if (hasRepo) {
        debug('user has fork');
        req.result = routeResult.redirect('/');
      } else {
        debug('no fork');
        req.result = routeResult.render(path.join(__dirname, 'waitforfork'));
      }
    });
}

var createForkRouter = express.Router();
(function (router) {
  router.use(requiresAuth);
  router.use(githubAccount.createAccount);
  router.usePromise(ensureNoFork);
  router.usePromise(createFork);
})(createForkRouter);

var pollForForkRouter = express.Router();

(function (router) {
  router.use(requiresAuth);
  router.use(githubAccount.createAccount);
  router.usePromise(checkForFork);
})(pollForForkRouter);

_.extend(exports, {
  createFork: createForkRouter,
  pollForFork: pollForForkRouter
});
