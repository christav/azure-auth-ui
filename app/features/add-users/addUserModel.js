//
// Model representing the processing for adding a user.
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:AddUserModel');
var maybe = require('maybeish');
var Q = require('q');
var sfmt = require('sfmt');

var AzureOrganization = require('../../lib/azure-organization');

//
// Object representing a model for data received
// from a post to the add user page
//

function AddUserPostModel(githubClient, postBody) {
  this.github = githubClient;
  // Kick of fetch of org file and save promise
  // so we can attach to it later.
  this.orgFile = this.github.getOrgFile()
    .then(function (rawData) {
      debug('Org data downloaded, wrapping in azure org');
      return new AzureOrganization(rawData.content);
    });

  this.body = postBody;
  this.selectedOrg = maybe(postBody, 'orgToUpdate')();
  this.users = [];
  this.errors = [];
  debug('construction complete');
}

_.extend(AddUserPostModel.prototype, {
  //
  // Create read model that doesn't contain any users.
  // Returns promise for the read model.
  //
  getReadModel: function () {
    var self = this;
    return self.orgFile
      .then(function (orgFile) {
        var orgs = orgFile.getOrganizations();
        debug(sfmt('There are %{0} organizations', orgs.length));
        return {
          orgs: orgs,
          selectedOrg: self.selectedOrg,
          users: self.users,
          errors: self.errors
        };
      });
  },

  //
  // Check if post is valid - returns promise for
  // bool - true ok, false not, with this.errors set
  // to array of error messages.
  //
  isValidPost: function () {
    var self = this;

    return self.orgFile
      .then(function (orgFile) {
        if (!self.selectedOrg) {
          self.errors.push('No organization given');
        } else if (!_.has(orgFile.getOrgMap(), self.selectedOrg)) {
          self.errors.push('Organization given does not exist');
        }

        var githubUsers = _.flatten([self.body.githubUser]);
        var microsoftAliases = _.flatten([self.body.microsoftAlias]);

        if (!githubUsers || !microsoftAliases) {
          errors.push('Missing user data');
        }

        if (githubUsers && microsoftAliases && (githubUsers.length !== microsoftAliases.length)) {
          self.errors.push('User names and aliases do not match up!');
        }

        return self.errors.length === 0;
    });
  },

  // Take the post body, set the this.users field to user objects.
  usersFromPostBody: function () {
    // Use _.flatten to ensure that the list of values are arrays even if only one item
    var githubUsers = _.flatten([this.body.githubUser]);
    var msAliases = _.flatten([this.body.microsoftAlias]);

    debug(sfmt('Creating users lists from post body, post githubUsers = %i, microsoftAliases = %i', this.body.githubUser, this.body.microsoftAlias));

    // Turn pair of lists into list of pairs
    this.users = _.zip(githubUsers, msAliases)
      .map(function (pair) {
        return {
          githubUser: pair[0],
          microsoftAlias: pair[1],
          errorMessage: ''
        };
      });
  },

  //
  // Are all the users listed valid?
  // Returns promise for bool, sets errors if failure
  //
  // Checks if users are in github, and also
  // if user is already in the file or not.
  //
  areValidUsers: function () {
    this.usersFromPostBody();

    return Q.all([this.githubUsersExist(), this.usersAreNew()])
      .then(function (existsResults) {
        var githubExists = existsResults[0];
        var usersAreNew = existsResults[1];
        debug(sfmt('areValidUsers: github users exists: %{0}, users are new: %{1}', githubExists, usersAreNew));
        return githubExists && usersAreNew;
      });
  },

  githubUsersExist: function () {
    var self = this;

    return self.orgFile
      .then(function (orgFile) {
        return Q.all(
          self.users.map(function (user) {
            user.errorMessage = '';
            return self.github.userExists(user.githubUser)
              .then(function (exists) {
                if (!exists) {
                  user.errorMessage += 'Github user does not exist';
                  return false;
                }
                return true;
              });
          }))
      })
      .then(function (eachExists) {
        return _.all(eachExists);
      });
  },

  usersAreNew: function() {
    var self = this;

    return self.orgFile
      .then(function (orgFile) {
        return _.all(self.users.map(function (user) {
          var result = true;
          if (orgFile.githubUserInFile(user.githubUser)) {
            user.errorMessage += 'This github user is already in the file';
            result = false;
          }
          if (orgFile.microsoftAliasInFile(user.microsoftAlias)) {
            debug(sfmt('Microsoft alias %{0} is already in the file', user.microsoftAlias));
            user.errorMessage += (result ? 'T' : ' and t') + 'his Microsoft alias is already in the file';
            result = false;
          }
          return result;
        }));
      });
  },

  addUsers: function () {
    var self = this;
    return self.orgFile
      .then(function (orgFile) {
        self.users.forEach(function (user) {
          orgFile.addUserToOrg(user, self.selectedOrg);
        });
      });
  },

  selectedOrgDisplayName: function () {
    var self = this;
    return self.orgFile
      .then(function (orgFile) {
        return orgFile.getOrgDisplayName(self.selectedOrg);
      });
  }
});

module.exports = AddUserPostModel;
