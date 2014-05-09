//
// Wrapper APIs around the github APIs.
// Wraps single getters in a promise,
// and lists in Rx observables.
//

'use strict';

var _ = require('lodash');
var GitHubApi = require('github');
var Q = require('q');
var Rx = require('rx');

//
// Helper function to look up a method on an object
// through a series of subobjects. Returns a function
// bound to the proper context.
//
function getFunction(root, path) {
  if (!path) {
    return root;
  }
  var target = root;
  path.split('.').forEach(function (part) {
    root = target;
    target = target[part];
  });
  return target.bind(root);
}

function Client(authToken) {
  this.client = new GitHubApi({ version: '3.0.0' });
  this.client.authenticate({
    type: 'oauth',
    token: authToken
  });
}

_.extend(Client.prototype, {
  get: function(methodPath, msg) {
    return Q.nfcall(getFunction(this.client, methodPath), msg);
  },

  list: function (methodPath, msg) {
    var subject = new Rx.Subject();
    var client = this.client;

    function processPage(err, results) {
      if (err) {
        return subject.onError(err);
      }

      results.forEach(function (item) {
        subject.onNext(item);
      });

      if (client.hasNextPage(results)) {
        client.getNextPage(results, processPage);
      } else {
        subject.onCompleted();
      }    
    }

    getFunction(this.client, methodPath)(msg, processPage);

    return subject.asObservable();
  }
});

module.exports = Client;
