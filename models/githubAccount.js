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
  }
});

function createAccount(req, res, next) {
  if (req.github && req.user) {
    req.account = new GithubAccount(req.github, req.user.username);
  }
  next();
}

_.extend(exports, {
  GithubAccount: GithubAccount,
  createAccount: createAccount
});
