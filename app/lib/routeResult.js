//
// Various Result types - results are functions that get stored
// in the req.result field. The final middleware then executes
// that function at the end of request processing.
//
// This lets us represent the final execution of a controller
// action as an object and gives us some downstream control,
// while still letting us package the processing as individual
// separate middleware functions.
//

'use strict';

var debug = require('debug')('azure-auth-ui:results');

function renderResult(template, model) {
  return function (req, res) {
    debug('Rendering template ' + template);
    res.render(template, model);
  };
}

function redirectResult(url) {
  return function (req, res) {
    debug('Redirecting to ' + url);
    res.redirect(url);
  };
}

function errorResult(errCode, message) {
  return function (req, res) {
    debug('Ending request with error code ' + errCode + ', message ' + message);
    res.send(errCode, message);
  };
}

function executeResultMiddleware(req, res) {
  if (!req.result) {
    debug('No result object to render');
    res.send(500, 'No result on request to execute');
  } else {
    debug('Executing result');
    req.result(req, res);
  }
}

module.exports = {
  render: renderResult,
  redirect: redirectResult,
  error: errorResult,
  execute: executeResultMiddleware
};
