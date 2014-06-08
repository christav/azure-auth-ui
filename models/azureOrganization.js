//
// Model file representing the azure organization file itself.
// Provides methods to do various queries and updates.
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:AzureOrganization');
var stringify = require('canonical-json');

var sfmt = require('../lib/sfmt');

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
  }
});

module.exports = AzureOrganization;
