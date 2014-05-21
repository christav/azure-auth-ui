//
// Model representing user's github account.
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:GithubAccount');
var GitHubApi = require('../lib/github');
var Q = require('q');
var util = require('util');

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

// TODO: Replace deferred with Q.promise
    var d = Q.defer();

    this.client.list('repos.getForks', masterRepo)
      .first(function (fork) {
        return fork.owner.login === self.username;
      })
      .subscribe(
        function onNext(fork) {
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
          d.resolve(true);
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
  },

  createUpdateFromMasterPullRequest: function () {
    var self = this;
    return self.client.get('pullRequests.create', {
      user: self.username,
      repo: masterRepo.repo,
      title: '[Do not merge] Sync to upstream',
      body: 'Updating from upstream master branch',
      base: 'master',
      head: masterRepo.user + ':master'
    }).then(function (pullRequest) {
      return pullRequest.number;
    }, function (err) {
      debug('Github PR creation failed, ' + util.inspect(err));
      if (/no commits between/i.test(err.message)) {
        debug('No updates in master, no PR needed');
        return 0;
      } else {
        throw err;
      }
    });
  },

  mergeLocalPullRequest: function (prNumber) {
    var self = this;

    return self.client.get('pullRequests.merge', {
      user: self.username,
      repo: masterRepo.repo,
      number: prNumber,
      commit_message: 'Update from upstream'
    })
    .then(function (result) {
      return result.merged;
    })
  },

  getBranchSha: function (branchName) {
    var self = this;

    return self.client.get('gitdata.getReference', {
      user: self.username,
      repo: masterRepo.repo,
      ref: 'heads/' + branchName
    })
    .then(function (result) {
      debug(util.format('branch %s points at commit %s', branchName, result.object.sha));
      return result.object.sha;
    })
  },

  createBranch: function (baseBranch,, newBranchName) {
    var self = this;

    rturn self.getBranchSha(baseBranch)
      .then(function (baseBranchSha) {
        return self.client.get('gitdata.createReference', {
          user: self.username,
          repo: masterRepo.repo,
          ref: 'heads/' + newBrancName,
          sha: baseBranchSha
        });
      });
  },

  getUniqueBranchName: function (rootOfName) {
    var self = this;
    var names = [];
    return Q.promise(function (resolve, reject) {
      self.client.list('gitdata.getAllReferences', {
        user: self.username,
        repo: masterRepo.repo
      })
      .filter(function (ref) { return /^refs\/heads\//.test(ref.ref); })
      .map(function (ref) {

      })
      .subscribe(function onNext(ref) {
        names.push(ref.)
      },
      function onNext(err) {
        reject(err);
      },

      function onComplete() {
        
      });
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
