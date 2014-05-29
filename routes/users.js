'use strict';

var express = require('express');
var passport = require('passport');
var controller = require('../controllers/createForkController');
var render = require('../lib/render');
var router = express.Router();

router.post('/createfork', controller.createFork);

router.get('/waitforfork', controller.pollForFork, render.template('waitforfork'));

module.exports = router;
