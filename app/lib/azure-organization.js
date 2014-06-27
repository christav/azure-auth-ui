//
// Model file representing the azure organization file itself.
// Provides methods to do various queries and updates.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:AzureOrganization');
var sfmt = require('sfmt');
var stringify = require('canonical-json');


function AzureOrganization(parsedOrgFile) {
  this.orgData = parsedOrgFile;
  this.mappings = _(this.orgData.organizations)
    .values()
    .pluck('mapping')
    .value();
}

_.extend(AzureOrganization.prototype, {
  getOrganizations: function () {
    debug('Getting organization list from data');
    return _.chain(this.orgData.organizations)
      .pairs()
      .map(function (pair) {
        return {
          displayName: pair[1].name,
          key: pair[0],
          description: pair[1].purpose
        }
      })
      .sortBy('displayName')
      .value();
  },

  getOrgMap: function () {
    return this.orgData.organizations;
  },

  getOrgDisplayName: function (orgKey) {
    return this.orgData.organizations[orgKey].name;
  },

  githubUserInFile: function (userName) {
    var self = this;
    return _.any(this.mappings, function (mapping) {
      return _.has(mapping, userName);
    });
  },

  microsoftAliasInFile: function (alias) {
    var self = this;
    return _.any(this.mappings, function (mapping) {
      return _.has(_.invert(mapping), alias);
    });
  },

  addUserToOrg: function (user, orgKey) {
    this.orgData.organizations[orgKey].mapping[user.githubUser] = user.microsoftAlias;
  },

  getRawData: function () {
    return stringify(this.orgData, null, 4);
  },

  githubUserFromAlias: function (alias) {
    for(var i = 0; i < this.mappings.length; ++i) {
      var m = _.invert(this.mappings[i]);
      if (_.has(m, alias)) {
        return m[alias];
      }
    }
    return null;
  },

  orgIdFromGithubUser: function (user) {
    return _.chain(this.orgData.organizations)
      .pairs()
      .filter(function (pair) { return _.has(pair[1].mapping, user); })
      .map(function (pair) { return pair[0]; })
      .first()
      .value();
  },

  reposForOrg: function (orgId) {
    return _.keys(this.orgData.organizations[orgId].repos);
  },

  reposForTeam: function (orgId, teamId) {
    // TODO: Figure this out when I'm more awake
    return _.flatten(this.orgData.organizations[orgId].teams[teamId].repos.map(function (repo) {
      if (/^organization:(.*)$/.match(repo)) {
        return match[1];
      }
      return repo;
    }));
  },

  accessForUser: function (user) {
    var orgId = 'organization:' + this.orgIdFromGithubUser(user);
    return _.chain(this.orgData.organizations)
      .values()
      .pluck('teams')
      .filter(function (team) { return team; })
      .map(function (team) { return _.values(team); })
      .flatten()
      .filter(function (team) {
          return _.any(team.members, function (member) { return member === user || member === orgId; });
      })
      .map(function (team) {
        return _.map(team.repos, function (r) { return { repo: r, access: team.access }; });
      })
      .flatten()
      .groupBy('repo')
      .pluck(0)
      .groupBy('repo')
      .value();
  }
});

module.exports = AzureOrganization;
