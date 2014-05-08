//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

var express = require('express');
var router = express.Router();

var GitHubApi = require('github');

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

function checkAccess(req, res, next) {
  if (!req.model.authorized) {
    return next();
  }

  var github = new GitHubApi({ version: '3.0.0' });
  github.authenticate({
    type: 'oauth',
    token: req.user.accessToken
  });

  //
  // Try to get the info for the azure-auth repo. If you
  // can't get it, this github user doesn't have permissions.
  //
  github.repos.get({user: 'Azure', repo: 'azure-github-organization'}, function (err, repo) {
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

router.use(checkAuthorization);
router.use(checkAccess);

module.exports = router;
