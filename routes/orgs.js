//
// route for org operations
//

var express = require('express');
var router = express.Router();

var addUserViewModel = require('../models/adduserViewModel');
var render = require('../lib/render');
var requiresAuth = require('../lib/requiresAuth');

router.use(requiresAuth);
router.get('/adduser', addUserViewModel, render.template('adduser'));

module.exports = router;
