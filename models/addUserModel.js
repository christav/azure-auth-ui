//
// Model creation middleware for the add user to org use case
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:addUserViewModel');
var express = require('express');
var util = require('util');

var githubAccount = require('./githubAccount');

function loadAuthFile(req, res, next) {
  req.model = req.model || { };

  req.account.getOrgFile()
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
      next();
    }, function (err) {
      next(err);
    });
}

function validateInput(req, res, next) {
  debug('validation goes here');
  debug('body: ' + util.inspect(req.body));
  // TODO: Make sure to force the githubUser and microsoftAlias
  // properties on the body to be arrays - if there's only
  // one value, they'll come back as scalars.
  next();
}

function updateLocalFork(req, res, next) {
  debug('Updating user repo from master');
  req.account.createUpdateFromMasterPullRequest()
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
      next();
    }, function (err) {
      debug('Pull request creation failed, ' + util.inspect(err));
      next(err);
    });
}

function generatePullRequest(req, res, next) {
  debug('generating pull request goes here');
  next();
}

function finalRedirect(req, res) {
  debug('redirecting to home page');
  res.redirect('/');
}

var inputPageRouter = express.Router();

(function (router) {
router.use(githubAccount.createAccount);
router.use(loadAuthFile);
}(inputPageRouter));

var processPostRouter = express.Router();

(function (router) {
  router.use(githubAccount.createAccount);
  router.use(loadAuthFile);
  router.use(validateInput);
  router.use(updateLocalFork);
  router.use(generatePullRequest);
  router.use(finalRedirect);
}(processPostRouter
));

exports.uiModel = inputPageRouter;
exports.submitModel = processPostRouter;
