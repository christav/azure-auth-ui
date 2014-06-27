'use strict';

var express = require('express');
var passport = require('passport');
var controller = require('./create-fork-controller');
var requiresAuth = require('../../lib/requires-auth');
var routeResult = require('../../lib/route-result');

var router = express.Router();
router.use(requiresAuth);
router.post('/createfork', controller.createFork, routeResult.execute);
router.get('/waitforfork', controller.pollForFork, routeResult.execute);

module.exports = router;
