//
// Model creation middleware for the add user to org use case
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:addUserController');
var express = require('express');
var Q = require('q');
var util = require('util');
var promiseUtils = require('../lib/promise-utils');

var githubAccount = require('../models/githubAccount');
var AzureOrganization = require('../models/azureOrganization');

function loadAuthFile(req, res) {
  req.model = req.model || { };

  return req.account.getOrgFile()
    .then(function (orgFile) {
      req.model = new AzureOrganization(orgFile.content);
      req.model.orgs = req.model.getOrganizations();
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
  .then(function (branchName) {
    debug('created branch ' + branchName);

    var authContent = "Destroy the file!";
    return req.account.updateAuthFile(branchName, authContent);
  })
  .then(function (updateResult) {
    debug('file updated, new commit id = ' + updateResult.commit.sha);
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

exports.get = inputPageRouter;
exports.post = processPostRouter;
