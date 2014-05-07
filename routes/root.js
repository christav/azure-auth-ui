var express = require('express');
var router = express.Router();
var util = require('util');
var GitHubApi = require('github');

/* GET home page. */
router.get('/', function(req, res) {
  var title = 'Azure Github Authorization tool';

  var organizations = [];
  if (req.user) {
    var github = new GitHubApi({
      version: "3.0.0"
    });
    github.authenticate({
      type: 'oauth',
      token: req.user.accessToken
    });

    github.user.getOrgs({}, function (err, orgs) {
      if (err) {
        organizations.push('Error: ' + err.message);
      } else {
        orgs.forEach(function (orgData) {
          organizations.push(orgData.login);
        });
      }
      res.render('index', { title: title, user: req.user, orgs: organizations});
    });
  } else {
    res.render('index', { title: title });
  }
});

module.exports = router;
