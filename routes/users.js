var express = require('express');
var passport = require('passport');
var forkController = require('../controllers/createForkController');
var render = require('../lib/render');
var router = express.Router();

router.post('/createfork', forkController.createFork);

router.get('/waitforfork', forkController.pollForFork, render.template('waitforfork'));

module.exports = router;
