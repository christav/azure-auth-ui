'use strict';

var express = require('express');
var passport = require('passport');
var controller = require('../controllers/createForkController');
var routeResult = require('../lib/routeResult');

var router = express.Router();

router.post('/createfork', controller.createFork, routeResult.execute);
router.get('/waitforfork', controller.pollForFork, routeResult.execute);

module.exports = router;
