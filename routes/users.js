var express = require('express');
var passport = require('passport');
var forkModel = require('../models/createForkModel');
var render = require('../lib/render');
var router = express.Router();

router.post('/createfork', forkModel.createFork);

router.get('/waitforfork', forkModel.pollForFork, render.template('waitforfork'));

module.exports = router;
