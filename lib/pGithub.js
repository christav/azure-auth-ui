//
// Wrappers around github API functions that return
// a single value to return promises instead.
//

var Q = require('q');

function getFunction(root, path) {
  var target = root;
  path.split('.').forEach(function (part) {
    root = target;
    target = target[part];
  });
  return target.bind(root);
}

function pGithub(client, methodPath, message) {
  return Q.nfcall(getFunction(client, methodPath), message);
}

module.exports = pGithub;
