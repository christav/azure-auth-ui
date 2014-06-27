//
// route for add user operations
//

'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./add-user-controller');
var requiresAuth = require('../../lib/requires-auth');
var routeResult = require('../../lib/route-result');

router.use(requiresAuth);
router.get('/', controller.get, routeResult.execute);
router.post('/', controller.post, routeResult.execute);
router.get('/pralready', controller.getPrAlready, routeResult.execute);

module.exports = router;
