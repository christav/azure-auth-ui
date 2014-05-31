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

var githubAccount = require('../models/githubAccount');
var AzureOrganization = require('../models/azureOrganization');

//
// Middleware used on get request to the add user page
//

function loadAuthFile(req, res) {
  return req.account.getOrgFile()
    .then(function (orgFile) {
      req.orgFile = new AzureOrganization(orgFile.content);
    });
}

function orgFileToEmptyReadModel(req, res, next) {
  var orgs = req.orgFile.getOrganizations();

  req.model = {
    orgs: orgs,
    selectedOrg: orgs[0].key,
    users: [],
    errors: []
  };
  next();
}

var inputPageRouter = express.Router();
inputPageRouter.use(githubAccount.createAccount);
inputPageRouter.usePromise(loadAuthFile);
inputPageRouter.use(orgFileToEmptyReadModel);


//
// Middleware used when posted for the add user page.
//

function requestToPostModel(req, res, next) {
  req.input = {
    orgId: req.body['orgToUpdate'],
    users: _.zip(_.flatten(req.body['githubUser']), _.flatten(req.body['microsoftAlias']))
      .map(function (pair) { return {
        githubUser: pair[0],
        microsoftAlias: pair[1]
      }})
  };
  debug('req.body =' + util.inspect(req.body));
  next();
}

function validateInput(req, res, next) {
  req.model = {
    orgs: req.orgFile.getOrganizations(),
    selectedOrg: req.input.orgId,
    users: req.input.users.map(function (user) {
      user.githubUser = 'x' + user.githubUser;
      return user;
    }),
    errors: ['None shall pass!']
  };

  render.template('adduser')(req, res);
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


var processPostRouter = express.Router();
processPostRouter.use(githubAccount.createAccount);
processPostRouter.usePromise(loadAuthFile);
processPostRouter.use(requestToPostModel);
processPostRouter.usePromise(validateInput);
// processPostRouter.usePromise(updateLocalFork);
// processPostRouter.usePromise(generatePullRequest);
// processPostRouter.usePromise(finalRedirect);

exports.get = inputPageRouter;
exports.post = processPostRouter;
