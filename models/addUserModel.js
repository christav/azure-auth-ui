//
// Model representing the processing for adding a user.
//

var _ = require('lodash');
var Q = require('q');

//
// Object representing a model for data received
// from a post to the add user page
//

function AddUserPostModel(githubClient, postBody) {
  this.github = githubClient;
  // Kick of fetch of org file and save promise
  // so we can attach to it later.
  this.orgFile = this.github.getOrgFile();
  this.body = postBody;
  this.users = [];
  this.errors = [];
}

_.extend(AddUserPostModel.prototype, {
  //
  // Create read model that doesn't contain any users.
  // Returns promise for the read model.
  //
  emptyReadModel: function () {
    return this.orgFile
      .then(function (orgFile) {
        var orgs = orgFile.getOrganizations();
        return {
          orgs: orgs,
          selectedOrg: orgs[0].key,
          users: this.users,
          errors: this.errors
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
        if (!self.postBody.orgToUpdate) {
          self.errors.push('No organization given');
        } else if (!_.has(orgFile.getOrgMap(), postBody.orgToUpdate)) {
          self.errors.push('Organization given does not exist');
        }

        var githubUsers = self.postBody.githubUser;
        var microsoftAliases = self.postBody.microsoftAlias;

        if (!githubUsers || !microsoftAliass) {
          errors.push('Missing user data');
        }

        if (githubUsers && microsoftAlias && (githubUsers.length !== microsoftAliases.length)) {
          self.errors.push('User names and aliases do not match up!');
        }

        return errors.length === 0;
    });
  },

  // Take the post body, set the this.users field to user objects.
  function usersFromPostBody: function () {
    // Use _.flatten to ensure that the list of values are arrays even if only one item
    var githubUsers = _.flatten(this.postBody.githubUser);
    var msAliases = _.flatten(this.postBody.microsoftAlias);

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
  areValidUsers: function () {
    usersFromPostBody();

    var self = this;
    return self.orgFile
      .then(function (orgFile) {
        return Q.all(
          self.users.map(function (user) {
            return self.github.userExists(user.githubUser)
              .then(function (exists) {
                if (!exists) {
                  user.errorMessage = 'Github user does not exist';
                  return false;
                }
                return true;
              });
          }))
      })
      .then(function (eachExists) {
        return _.all(eachExists));
      });
  }
});

module.exports = AddUserPostModel;
