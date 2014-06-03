//
// Helper functions to map promises to express/node
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:promise-utils');
var express = require('express');
var Q = require('q');

var sfmt = require('./sfmt');

function middlewareify(promiseReturningHander) {
	return function (req, res, next) {
		promiseReturningHander(req, res)
			.then(function (requestCompleted) {
				if (!requestCompleted) {
					next();
				}
			}, function (err) {
				next(err);
			});
	};
};

function ifNoResult(promiseReturningMiddleware) {
	return function (req, res) {
		if (req.result) {
			return Q(false);
		}
		return promiseReturningMiddleware(req, res);
	};
}

function usePromise(router) {
	for(var i = 1; i < arguments.length; ++i) {
		router.use(exports.middlewareify(arguments[i]));
	}
}

//
// Monkey patch express routers to add the usePromise method
//

express.Router.usePromise = function () {
	var self = this;
	_.chain(arguments)
		.map(function (p) { return middlewareify(p); })
		.forEach(function (middleware) {
			self.use(middleware);
		});
}

_.extend(exports, {
	middlewareify: middlewareify,
	usePromise: usePromise,
	ifNoResult: ifNoResult
});
