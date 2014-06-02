//
// route for org operations
//

'use strict';

var express = require('express');
var router = express.Router();

var controller = require('../controllers/addUserController');
var requiresAuth = require('../lib/requiresAuth');
var routeResult = require('../lib/routeResult');

router.use(requiresAuth);
router.get('/adduser', controller.get, routeResult.execute);
router.post('/adduser', controller.post, routeResult.execute);
module.exports = router;
