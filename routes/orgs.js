//
// route for org operations
//

var express = require('express');
var router = express.Router();

var addUserModel = require('../models/addUserModel');
var render = require('../lib/render');
var requiresAuth = require('../lib/requiresAuth');

router.use(requiresAuth);
router.get('/adduser', addUserModel.uiModel, render.template('adduser'));
router.post('/adduser', addUserModel.submitModel);
module.exports = router;
