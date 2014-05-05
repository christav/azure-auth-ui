var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var routes = require('./routes');

passport.use(new LocalStrategy(
  function (username, password, done) {
    if (username === 'chris' && password === 'secret') {
      return done(null, { username: 'chris' });
    }
    return done(null, false, { message: 'Unknown user'});
  }));

passport.serializeUser(function (user, done) {
  console.log("Serializing user", user);
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  console.log('passport deserializing user', user);
  done(null, user);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use(session({
    secret: 'new secret'
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes.root);
app.use('/users', routes.users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
