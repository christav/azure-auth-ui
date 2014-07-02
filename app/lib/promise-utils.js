//
// Helper functions to map promises to express/node
//

'use strict';

var _ = require('lodash');
var debug = require('debug')('azure-auth-ui:promise-utils');
var express = require('express');
var Promise = require('bluebird');
var sfmt = require('sfmt');

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
			return Promise.resolve(false);
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
// Helper functions - probably don't belong here but
// might as well.
//
// Wrap a middleware function or functions in a wrapper
// that tests a predicate against the request first. If
// the predicate returns true, run the middleware, otherwise
// don't.
//
function useIf(predicate) {
	var router = express.Router();
	_.rest(arguments).forEach(function (middleware) {
		router.use(middleware);
	});

	return function (req, res, next) {
		if(predicate(req)) {
			router(req, res, next);
		} else {
			next();
		}
	}
}

function usePromiseIf(predicate) {
	return useIf.apply(null,
		[predicate].concat(
			_.rest(arguments).map(function (m) {
				return middlewareify(m);
			})
		)
	);
}

//
// Monkey patch express routers to add the usePromise, useIf,
// and usePromiseIf methods.
//

express.Router.usePromise = function () {
	var self = this;
	_.chain(arguments)
		.map(function (p) { return middlewareify(p); })
		.forEach(function (middleware) {
			self.use(middleware);
		});
}

express.Router.useIf = function() {
	this.use(useIf.apply(null, arguments));
};

express.Router.usePromiseIf = function () {
	this.use(usePromiseIf.apply(null, arguments));
};

_.extend(exports, {
	middlewareify: middlewareify,
	usePromise: usePromise,
	ifNoResult: ifNoResult,
	useIf: useIf,
	usePromiseIf: usePromiseIf
});
