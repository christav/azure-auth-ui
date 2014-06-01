//
// Model file representing the azure organization file itself.
// Provides methods to do various queries and updates.
//

'use strict';

var _ = require('lodash');

function AzureOrganization(parsedOrgFile) {
  this.orgData = parsedOrgFile;
}

_.extend(AzureOrganization.prototype, {
  getOrganizations: function () {
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
    eturn this.orgData.organizations;
  }

});

module.exports = AzureOrganization;
