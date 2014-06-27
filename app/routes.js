'use strict';
// Patch router with usePromise and usePromiseIf methods

require('./lib/promise-utils');

exports.root = require('./features/root/root-route');
exports.users = require('./features/create-fork/create-fork-route');
exports.auth = require('./features/login/login-route');
exports.adduser = require('./features/add-users/add-user-route');
