//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

var _ = require('lodash');
var express = require('express');
var router = express.Router();

var GitHubApi = require('github');
var rxGithub = require('../lib/rxGithub');

var masterRepo = {
  user: 'Azure',
  repo: 'azure-github-organization'
};

function checkAuthorization(req, res, next) {
  if (!req.user) {
    req.model = { authorized: false };
  } else {
    req.model = {
      authorized: true,
      username: req.user.username,
      displayName: req.user.displayname
    };
  }
  next();
}

function createGithubClient(req, res, next) {
  if (!req.user) {
    return next();
  }

  var github = new GitHubApi({ version: '3.0.0' });
  github.authenticate({
    type: 'oauth',
    token: req.user.accessToken
  });

  req.github = github;
  next();
}

function checkAccess(req, res, next) {
  if (!req.github) {
    return next();
  }

  var github = req.github;

  //
  // Try to get the info for the azure-auth repo. If you
  // can't get it, this github user doesn't have permissions.
  //
  github.repos.get(masterRepo, function (err, repo) {
    if (err && err.code !== 404) {
      req.model.error = 'Could not access github, error = ' + JSON.parse(err.message).message;
    } else if (err && err.code === 404) {
      req.model.repoAccess = false;
    } else {
      req.model.repoAccess = true;
    }
    next();
  });
}

function checkForFork(req, res, next) {
  req.model.hasFork = false;

  if (!req.model.repoAccess) {
    return next();
  }

  rxGithub(req.github, 'repos.getForks', masterRepo)
    .firstOrDefault(function (fork) {
      return fork.owner.login === req.user.username;
    })
    .subscribe(
      function onNext(fork) {
        if (fork !== null) {
          req.model.hasFork = true;
        }
      },
      function onError(err) {
        req.model.error = 'Error accessing github: ' + JSON.parse(err.message).message;
        next();
      },
      function onCompleted() {
        next();
      }
    );
}

router.use(checkAuthorization);
router.use(createGithubClient);
router.use(checkAccess);
router.use(checkForFork);

module.exports = router;
