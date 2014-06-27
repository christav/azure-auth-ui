'use strict';

var express = require('express');
var router = express.Router();

var routeResult = require('../../lib/route-result');
var controller = require('./rootController');

/* GET home page. */
router.get('/', controller.get, routeResult.execute);

module.exports = router;
