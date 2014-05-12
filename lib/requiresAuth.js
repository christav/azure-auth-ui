//
// Simple middleware to require authentication
//

var debug = require('debug')('azure-auth-ui:authCheck');

function requiresAuth(req, res, next) {
  if (!req.user) {
    debug('No authenticated user');
    res.redirect('/');
  } else {
    debug('Authorized user found');
    req.model = req.model || {};
    req.model.authorized = true;
    next();
  }
}

module.exports = requiresAuth;
