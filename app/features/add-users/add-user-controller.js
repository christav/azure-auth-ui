//
// Model creation middleware for the add user to org use case
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:add-user-controller');
var express = require('express');
var path = require('path');
var Q = require('q');
var sfmt = require('sfmt');
var util = require('util');

var githubAccount = require('../../lib/github-account');
var Model = require('./add-user-model');
var promiseUtils = require('../../lib/promise-utils');
var routeResult = require('../../lib/route-result');

var addUserView = path.join(__dirname, 'adduser');
var prAlreadyView = path.join(__dirname, 'pralready');

//
// Middleware used on get request to the add user page
//
function processGet(req, res) {
  return Q(new Model(req.account))
  .then(function (model) { return model.getReadModel(); })
  .then(function (readModel) {
      req.result = routeResult.render(addUserView, readModel);
    });
}

var inputPageRouter = exports.get = express.Router();
inputPageRouter.use(githubAccount.createAccount);
inputPageRouter.usePromise(processGet);

//
// Middleware used when posted for the add user page.
//

//
// Start the post processing - create our model object.
//
function processPost(req, res, next) {
  req.input = new Model(req.account, req.body);
  next();
}

//
// Validate that the request data is correctly formatted;
// if not it came in from a request outside the UI and
// should be dropped.
//

function validatePostFormat(req, res) {
  return req.input.isValidPost()
    .then(function (isValidPost) {
      if (!isValidPost) {
        debug(sfmt('Invalid post: %i', req.input.errors));
        req.result = routeResult.error(400, 'Bad request');
      }
    });
}

//
// Validate that the post contains valid data - the users
// all exist, they aren't already in the list, etc.
// Will redisplay the form with the user inputs and any
// error messages if there are any.
//
function validatePostContent(req, res) {
  return req.input.areValidUsers()
    .then(function (validUsers) {
      if (!validUsers) {
        return req.input.getReadModel()
          .then(function (model) {
            debug('users already exist');
            req.result = routeResult.render(adduserView, model);
          });
      }
    });
}

//
// Create and merge a pull request from master branch to user's
// fork.
//
function pullMasterToLocal(req, res) {
  debug('Updating user repo from master');
  return req.account.createUpdateFromMasterPullRequest()
    .then(function (prNumber) {
      debug(prNumber === 0 ?
        'Local fork is up to date' :
        sfmt('PR number %d created', prNumber));
      if (prNumber !== 0) {
        debug('merging update pr');
        return req.account.mergeLocalPullRequest(prNumber);
      }
    })
    .then(function (result) {
      debug('merge result: ' + result);
    }, function (err) {
      debug(sfmt('Pull request creation failed, %i', err));
      if (err.code === 422 && /pull request already exists/.test(err.message)) {
        req.result = routeResult.redirect('/adduser/pralready');
      } else {
        throw err;
      }
    });
}

//
// Create branch on github for the user's update.
//
function createBranchForEdit(req, res) {
  return req.account.createUpdateBranch()
    .then(function (branchName) {
      req.branchName = branchName;
    });
}

//
// Update contents of the org file to add our new users,
// and write that change to the update branch.
//

function updateOrgFileInBranch(req, res) {
  return req.input.addUsers()
    .then(function () {
      return req.input.orgFile;
    })
    .then(function (orgFile) {
      var jsonData = orgFile.getRawData();
      return req.account.updateAuthFile(req.branchName, jsonData);
    })
    .then(function (updateResonse) {
      debug('org file updated on github');
    });
}

function sendPullRequestToMaster(req, res) {
  var prTitle;
  var prBody;

  return req.input.selectedOrgDisplayName()
    .then(function (displayName) {
      debug('Got org file, creating PR title and body');
      prTitle = sfmt('Adding users to %{0}', displayName);
      prBody = 'Adding users ' + req.input.users.map(function (user) {
        return sfmt('%{0}@microsoft.com (GitHub user %{1})', user.microsoftAlias, user.githubUser);
      }).join(', ');
      debug(sfmt('PR title = %{0}, PR body = %{1}', prTitle, prBody));
    })
    .then(function () {
      debug('Creating PR for update');
      return req.account.createBranchToMasterPullRequest(req.branchName,
        prTitle, prBody);
    })
    .then(function (prCreationResult) {
      debug(sfmt('Pull request number %{0} to master created', prCreationResult));
    },
    function (err) {
      debug(sfmt('Error creating pull request, %{0:i}', err));
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
      if (err.code === 422 && /pull request already exists/.test(err.message)) {
        req.result = routeResult.redirect('/adduser/pralready');
      } else {
        throw err;
      }
    });
}

function finalRedirect(req, res) {
  req.result = routeResult.redirect('/');
  return Q(false);
}

function noResult(req) {
  debug('checking if there\'s a result in the req already');
  if(req.result) {
    debug('there is');
  } else {
    debug('there isn\'t');
  }
  return !req.result;
}

var processPostRouter = exports.post = express.Router();
(function (r) {
  r.use(githubAccount.createAccount);
  r.use(processPost);
  r.usePromise(validatePostFormat);
  r.usePromiseIf(noResult, validatePostContent);
  r.usePromiseIf(noResult, pullMasterToLocal);
  r.usePromiseIf(noResult,
    createBranchForEdit,
    updateOrgFileInBranch,
    sendPullRequestToMaster,
    finalRedirect);
}(processPostRouter));

//
// Handling for the pralready error reporting page.
//

function getLocalPrFromMaster(req, res) {
  return req.account.getUpdateFromMasterPullRequest()
    .then(function (pr) {
      var model = {
        url: pr.html_url,
        title: pr.title,
        number: pr.number
      };
      debug(sfmt('Found open pull request %i', model));
      req.result = routeResult.render(prAlreadyView, model);
    });
}

var prAlreadyRouter = exports.getPrAlready = express.Router();
(function (r) {
  r.use(githubAccount.createAccount);
  r.usePromise(getLocalPrFromMaster);
}(prAlreadyRouter));

