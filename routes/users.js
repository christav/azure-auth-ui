var express = require('express');
var passport = require('passport');
var forkModel = require('../models/createForkModel');
var render = require('../lib/render');
var router = express.Router();

router.get('/login', passport.authenticate('github'));

router.get('/loggedIn',
  passport.authenticate('github', {
    failureRedirect: '/users/login'
  }),
  function (req, res) {
    res.redirect('/');
  });

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/createfork', forkModel.createFork);

router.get('/waitforfork', forkModel.pollForFork, render.template('waitforfork'));

module.exports = router;
