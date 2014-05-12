//
// Model creation middleware for the add user to org use case
//

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:addUserViewModel');
var express = require('express');
var router = express.Router();

var githubAccount = require('./githubAccount');

function loadAuthFile(req, res, next) {
  req.model = req.model || { };

  req.account.getOrgFile()
    .then(function (orgFile) {
      debug('orgFile retrieved, transforming into model');

      req.model.orgs = _.chain(orgFile.content.organizations)
        .pairs()
        .map(function (pair) {
          return {
            displayName: pair[1].name,
            key: pair[0],
            description: pair[1].purpose
          };
        })
        .sortBy('displayName')
        .value();
      next();
    }, function (err) {
      next(err);
    });
}

router.use(githubAccount.createAccount);
router.use(loadAuthFile);

module.exports = router;