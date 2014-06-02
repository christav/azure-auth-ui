//
// Model creation middleware for the add user to org use case
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:addUserController');
var express = require('express');
var Q = require('q');
var util = require('util');

var promiseUtils = require('../lib/promise-utils');
var render = require('../lib/render');
var routeResult = require('../lib/routeResult');
var sfmt = require('../lib/sfmt');

var githubAccount = require('../models/githubAccount');
var AzureOrganization = require('../models/azureOrganization');
var Model = require('../models/addUserModel');

//
// Middleware used on get request to the add user page
//
function processGet(req, res) {
  return Q(new Model(req.account))
  .then(function (model) { return model.getReadModel(); })
  .then(function (readModel) {
      req.result = routeResult.render('adduser', readModel);
    });
}

var inputPageRouter = express.Router();
inputPageRouter.use(githubAccount.createAccount);
inputPageRouter.usePromise(processGet);


//
// Middleware used when posted for the add user page.
//

function processPost(req, res) {
  var input = new Model(req.account, req.body);
  return input.isValidPost()
    .then(function (isValidPost) {
      if (!isValidPost) {
        res.send(400, 'Bad request');
        res.end();
        return true;
      }
      return input.areValidUsers()
        .then(function (validUsers) {
          if (!validUsers) {
            return input.getReadModel()
              .then(function (model) {
                req.model = model;
              });
          }
        });
    });
}

function createPullRequest(req, res) {
  return Q.fcall(function () {
    if (req.input) {
      return updateLocalFork(req.account)
        .then(function () {
          debug('creating branch for edit');
          return req.account.createUpdateBranch();
        })
        .then(function (branchName) {
          debug(sfmt('created branch %{0}', branchName));
          return req.input.addUsers()
            .then(function () {
              return createPullRequest(req.account, branchName, req.input);
            })
            .then(function (updateResult) {
              debug(sfmt('Final pull request created, commit ID = %{0}', updateResult.commit.sha));
            });
        });
    }
  });
}

function updateLocalFork(githubAccount) {
  debug('Updating user repo from master');
  return githubAccount.createUpdateFromMasterPullRequest()
    .then(function (prNumber) {
      debug(prNumber === 0 ?
        'Local fork is up to date' :
        sfmt('PR number %d created', prNumber));
      if (prNumber !== 0) {
        debug('merging update pr');
        return githubAccount.mergeLocalPullRequest(prNumber);
      }
    })
    .then(function (result) {
      debug('merge result: ' + result);
    }, function (err) {
      debug(sfmt('Pull request creation failed, %i', err));
      throw err;
    });
}

function generatePullRequest(githubAccount, branchName, addUserModel) {
  return addUserModel.orgFile
    .then(function (orgFile) {
      var authContent = JSON.stringify(orgFile.orgData);
      return githubAccount.updateAuthFile(branchName, authContent);
    })
  .then(function (updateResult) {
    debug('file updated, new commit id = ' + updateResult.commit.sha);
    return githubAccount.createBranchToMasterPullRequest(branchName);
  });
}

function finalRedirect(req, res) {
  return Q.fcall(function () {
    debug('redirecting to home page');
    res.redirect('/');
    return true;
  });
}


var processPostRouter = express.Router();
processPostRouter.use(githubAccount.createAccount);
processPostRouter.usePromise(processPost);
processPostRouter.usePromise(createPullRequest);
processPostRouter.usePromise(finalRedirect);

exports.get = inputPageRouter;
exports.post = processPostRouter;
