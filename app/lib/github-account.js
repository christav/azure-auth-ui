//
// Model representing user's github account.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:GithubAccount');
var GitHubApi = require('./github');
var Promise = require('bluebird');
var sfmt = require('sfmt');
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

    return new Promise(function (resolve, reject) {
      self.client.list('repos.getForks', masterRepo)
        .first(function (fork) {
          return fork.owner.login === self.username;
        })
        .subscribe(
          function onNext(fork) {
          },
          function onError(err) {
            if (err.message === 'Sequence contains no elements.') {
              debug('user does not have a fork');
              resolve(false);
            } else {
              reject(err);
            }
          },
          function onCompleted() {
            debug('user has fork');
            resolve(true);
          });
    });
  },

  createOrgRepoFork: function () {
    debug('creating fork');

    return this.client.get('repos.fork', masterRepo);
  },

  getOrgFile: function () {
    debug('downloading org file');

    return this.client.get('repos.getContent', _.extend({ path: 'azure.json' }, masterRepo))
      .then(function (content) {
        debug('content downloaded');
        var authData;

        try {
          var decoded = new Buffer(content.content, 'base64').toString();
          authData = JSON.parse(decoded);

          debug('content parsed');
          return {
            sha: content.sha,
            content: authData,
            raw: decoded
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
      title: 'Sync to upstream',
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

  getUpdateFromMasterPullRequest: function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.client.list('pullRequests.getAll', {
        user: self.username,
        repo: masterRepo.repo,
        state: 'open'
      })
      .where(function (pr) {
        return pr.head.repo.owner.login === masterRepo.user &&
          pr.head.repo.name === masterRepo.repo &&
          pr.head.ref === 'master';
      })
      .subscribe(
        function onNext(pr) {
          // Found the first one, promise can complete
          resolve(pr);
        },
        function onError(err) {
          reject(err);
        },
        function onComplete() {
          // don't care
        });
    });
  },

  createBranchToMasterPullRequest: function (branchName, title, body) {
    var self = this;
    return self.client.get('pullRequests.create', {
      user: masterRepo.user,
      repo: masterRepo.repo,
      title: title,
      body: body,
      base: 'master',
      head: self.username + ':' + branchName,
    }).then(function (pullRequest) {
      return pullRequest.number;
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

  createUpdateBranch: function () {
    var self = this;

    return self.getUniqueBranchName('auth-request')
      .then (function (branchName) {
        return self.createBranch('master', branchName)
          .then(function (branchCreate) {
            return branchName;
          });
      });
  },

  createBranch: function (baseBranch, newBranchName) {
    var self = this;

    return self.getBranchSha(baseBranch)
      .then(function (baseBranchSha) {
        return self.client.get('gitdata.createReference', {
          user: self.username,
          repo: masterRepo.repo,
          ref: 'refs/heads/' + newBranchName,
          sha: baseBranchSha
        });
      });
  },

  getUniqueBranchName: function (rootOfName) {
    var self = this;
    var names = [];
    return new Promise(function (resolve, reject) {
      self.client.list('gitdata.getAllReferences', {
        user: self.username,
        repo: masterRepo.repo
      })
      .filter(function (ref) { return /^refs\/heads\//.test(ref.ref); })
      .map(function (ref) {
        return ref.ref.slice('refs/heads/'.length);
      })
      .subscribe(function onNext(name) {
        names.push(name);
      },

      function onError(err) {
        reject(err);
      },

      function onComplete() {
        debug(sfmt('Current branch names: %s', names.join(', ')));
        resolve(names);
      });
    }).then(function (names) {
      var nameFormat = '%{0:s}-%{1:d}';
      var num = 1;
      var branchName = sfmt(nameFormat, rootOfName, num);
      while (_.contains(names, branchName)) {
        ++num;
        branchName = sfmt(nameFormat, rootOfName, num);
      }
      debug(sfmt('branch name to be created: %s', branchName));
      return branchName;
    });
  },

  updateAuthFile: function (authBranchName, newAuthContent) {
    var self = this;
    return self.client.get('repos.getContent', {
      path: 'azure.json',
      user: self.username,
      repo: masterRepo.repo,
      ref: 'refs/heads/' + authBranchName })
    .then(function (authContent) {
      var originalSha = authContent.sha;
      return self.client.get('repos.updateFile', {
        user: self.username,
        repo: masterRepo.repo,
        path: 'azure.json',
        message: 'New authorization update',
        content: new Buffer(newAuthContent).toString('base64'),
        sha: originalSha,
        branch: authBranchName
      });
    })
    .then(function (updateResponse) {
      debug(sfmt('Content updated with commit %s', updateResponse.commit.sha));
      return updateResponse;
    });
  },

  userExists: function (user) {
    var self = this;
    return self.client.get('user.getFrom', { user: user })
      .then(function (userData) {
        return true;
      }, function (err) {
        var errDetails = JSON.parse(err.message);
        if (errDetails.message === 'Not Found') {
          return false;
        }
        throw err;
      });
  },

  usersExist: function (users) {
    var self = this;
    return Promise.all(users.map(function (user) { return self.userExists(user); }));
  },

  // Return observable of the currently open
  // pull requests against the master repo
  // opened by the current user.
  getOpenPullRequests: function () {
    var self = this;
    return self.client.list('pullRequests.getAll', _.extend({state: 'open'}, masterRepo))
      .where(function (pr) { return pr.user.login === self.username; });
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
