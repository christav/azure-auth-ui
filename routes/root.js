var express = require('express');
var router = express.Router();
var render = require('../lib/render');
var rootModel = require('../models/rootModel');

/* GET home page. */
router.get('/', render.model(rootModel, 'index'));

module.exports = router;
