//
// Helper functions to map promises to express/node
//

exports.middlewareify = function middlewareify(promiseReturningHander) {
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

exports.usePromise = function usePromise(router) {
	for(var i = 1; i < arguments.length; ++i) {
		router.use(exports.middlewareify(arguments[i]));
	}
}
