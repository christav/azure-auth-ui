//
// Model representing user's github account.
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:GithubAccount');
var GitHubApi = require('../lib/github');
var Q = require('q');

var masterRepo = {
  user: 'Azure',
  repo: 'azure-github-organization'
};

function GithubAccount(client, username) {
  this.client = client;
  this.username = username;
}

_.extend(GithubAccount.prototype, {
  hasOrgAccess: function () {
    debug('checking if user has access');
    return this.client.get('repos.get', masterRepo)
      .then(function (repo) {
        debug('user has access');
        return true;
      }, function (err) {
        if (err.code === 404) {
          debug('user does not have access');
          return false;
        }
        else {
          debug('error contacting github, ' + err.message);
          throw err;
        }
      });
  },

  hasOrgRepoFork: function () {
    debug('checking for fork');

    var self = this;

    var d = Q.defer();
    var hasFork = false;

    this.client.list('repos.getForks', masterRepo)
      .first(function (fork) {
        return fork.owner.login === self.username;
      })
      .subscribe(
        function onNext(fork) {
          hasFork = true;
        },
        function onError(err) {
          if (err.message === 'Sequence contains no elements.') {
            debug('user does not have a fork');
            d.resolve(false);
          } else {
            d.reject(err);
          }
        },
        function onCompleted() {
          debug('user has fork');
          d.resolve(hasFork);
        });
    return d.promise;
  },

  createOrgRepoFork: function () {
    debug('creating fork');

    return this.client.get('repos.fork', masterRepo);
  },

  getOrgFile: function () {
    debug('downloading org file');

    return this.client.get('repos.getContent', _.extend({ path: 'azure.json'}, masterRepo))
      .then(function (content) {
        debug('content downloaded');
        var authData;

        try {
          var decoded = new Buffer(content.content, 'base64').toString();
          authData = JSON.parse(decoded);

          debug('content parsed');
          return {
            sha: content.sha,
            content: authData
          };
        } catch(ex) {
          debug('failed to parse org data file');
          return {
            sha: content.sha,
            error: 'Invalid JSON Data: ' + ex.message
          }
        }
      });
  }
});

function createAccount(req, res, next) {
  if (req.user) {
    debug('creating github client');
    debug('access token = ' + req.user.accessToken);
    var client = new GitHubApi(req.user.accessToken);
    debug('creating github account model');
    req.account = new GithubAccount(client, req.user.username);
  }
  next();
}

_.extend(exports, {
  GithubAccount: GithubAccount,
  createAccount: createAccount
});
