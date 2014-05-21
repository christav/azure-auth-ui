//
// Model creation middleware for the add user to org use case
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:addUserViewModel');
var express = require('express');
var Q = require('q');
var util = require('util');
var promiseUtils = require('../lib/promise-utils');

var githubAccount = require('./githubAccount');

function loadAuthFile(req, res) {
  req.model = req.model || { };

  return req.account.getOrgFile()
    .then(function (orgFile) {
      debug('orgFile retrieved, transforming into model');

      req.model.orgs = _.chain(orgFile.content.organizations)
        .pairs()
        .map(function (pair) {
          return {
            displayName: pair[1].name,
            key: pair[0],
            description: pair[1].purpose
          };
        })
        .sortBy('displayName')
        .value();
    });
}

function validateInput(req, res) {
  return Q.fcall(function () {
    debug('validation goes here');
    debug('body: ' + util.inspect(req.body));
    // TODO: Make sure to force the githubUser and microsoftAlias
    // properties on the body to be arrays - if there's only
    // one value, they'll come back as scalars.
  });
}

function updateLocalFork(req, res) {
  debug('Updating user repo from master');
  return req.account.createUpdateFromMasterPullRequest()
    .then(function (prNumber) {
      debug(prNumber === 0 ?
        'Local fork is up to date' :
        'PR number ' + prNumber + ' created');
      if (prNumber !== 0) {
        debug('merging update pr');
        return req.account.mergeLocalPullRequest(prNumber);
      }
    })
    .then(function (result) {
      debug('merge result: ' + result);
    }, function (err) {
      debug('Pull request creation failed, ' + util.inspect(err));
      throw err;
    });
}

function generatePullRequest(req, res) {
  debug('creating pull request for update');
  return req.account.createUpdateBranch()
    .then(function (branchRef) {
      debug('created branch ' + branchRef.ref);
    });
}

function finalRedirect(req, res) {
  return Q.fcall(function () {
    debug('redirecting to home page');
    res.redirect('/');
    return true;
  });
}

var inputPageRouter = express.Router();

(function (router) {
router.use(githubAccount.createAccount);
router.use(promiseUtils.middlewareify(loadAuthFile));
}(inputPageRouter));

var processPostRouter = express.Router();

(function (router) {
  router.use(githubAccount.createAccount);
  promiseUtils.usePromise(router,
    loadAuthFile,
    validateInput,
    updateLocalFork,
    generatePullRequest,
    finalRedirect);
}(processPostRouter));

exports.uiModel = inputPageRouter;
exports.submitModel = processPostRouter;
