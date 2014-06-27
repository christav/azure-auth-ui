//
// route for add user operations
//

'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./addUserController');
var requiresAuth = require('../../lib/requiresAuth');
var routeResult = require('../../lib/routeResult');

router.use(requiresAuth);
router.get('/', controller.get, routeResult.execute);
router.post('/', controller.post, routeResult.execute);
router.get('/pralready', controller.getPrAlready, routeResult.execute);

module.exports = router;
