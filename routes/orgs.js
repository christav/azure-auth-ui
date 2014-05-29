//
// route for org operations
//

var express = require('express');
var router = express.Router();

var controller = require('../controllers/addUserController');
var render = require('../lib/render');
var requiresAuth = require('../lib/requiresAuth');

router.use(requiresAuth);
router.get('/adduser', controller.get, render.template('adduser'));
router.post('/adduser', controller.post);
module.exports = router;
