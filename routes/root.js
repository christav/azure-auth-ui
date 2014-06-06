'use strict';

var express = require('express');
var router = express.Router();

var routeResult = require('../lib/routeResult');
var controller = require('../controllers/rootController');

/* GET home page. */
router.get('/', controller.get, routeResult.execute);

module.exports = router;
