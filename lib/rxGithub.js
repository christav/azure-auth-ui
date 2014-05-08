//
// Reactive Extension wrappers around github paging
//

var rx = require('rx');

function getFunction(root, path) {
  var target = root;
  path.split('.').forEach(function (part) {
    root = target;
    target = target[part];
  });
  return target.bind(root);
}

function githubObservable(client, methodPath, msg) {
  var subject = new rx.Subject();

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

  getFunction(client, methodPath)(msg, processPage);

  return subject.asObservable();
}

module.exports = githubObservable;
