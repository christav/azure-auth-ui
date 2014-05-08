//
// Model for the root url. Includes model class implementation
// plus a middleware function to load the model from the
// request. Places the model object on req.model.
//

var GitHubApi = require('github');

function createUnauthorizedModel(done) {
  done(null, { authorized: false });
}

function createAuthorizedModel(user, accessToken, done) {
  var github = new GitHubApi({ version: '3.0.0' });
  github.authenticate({
    type: 'oauth',
    token: accessToken
  });

  github.user.getOrgs({}, function (err, orgs) {
    if (err) {
      return done(new Error('Could not access github, ' + err.message));
    }

    done(err, {
      displayName: user.displayname,
      authorized: true,
      orgs: orgs.map(function (org) { return org.login; })
    });
  });
}

function loadModelMiddleware(req, res, next) {
  if (!req.user) {
    createUnauthorizedModel(function (err, model) {
      req.model = model;
      next();
    });
  } else {
    createAuthorizedModel(req.user, req.user.accessToken, function (err, model) {
      req.model = model;
      next();
    });
  }
}

module.exports = loadModelMiddleware;
