'use strict';

var express = require('express');
var router = express.Router();
var render = require('../lib/render');
var controller = require('../controllers/rootController');

/* GET home page. */
router.get('/', render.model(controller, 'index'));

module.exports = router;
