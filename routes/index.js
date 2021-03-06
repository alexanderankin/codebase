var express = require('express');
var router = express.Router();

var db = require('../db');
var hash = require('../db/util').hash;
var wipe = require('../db/install').wipe;
var updateEnv = require('../util').updateEnv;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});

router.get('/install', function (req, res, next) {
  res.locals.session = req.session || {};
  res.locals.query = req.query || {};
  res.render('install');
});

router.post('/install', function (req, res, next) {
  if ((req.body.resetpwd) === process.env['resetpwd']) {
    process.env = Object.assign(process.env, {
      mysqlu: req.body.mysqlu || process.env['MYSQL_USER'],
      mysqlp: req.body.mysqlp || process.env['MYSQL_PASSWORD'],
      mysqldb: req.body.mysqldb || process.env['MYSQL_DATABASE'],
    });

    updateEnv(req.body, function (err) {
      console.log('Error updating .env:', err + '');
    });

    db.reset({
      client: 'mysql',
      connection: {
        host: process.env['MYSQL_HOST'],
        user: process.env['MYSQL_USER'],
        password: process.env['MYSQL_PASSWORD'],
        database: process.env['MYSQL_DATABASE']
      }
    }, function () {
      req.session.body = null;
      if (req.body.install !== 'on')
        return res.redirect('/');

      wipe(err => {
        console.log(err);
        if (err) { err.skip = true; return next(err); }
        return res.redirect('/');
      });
    });
  }

  else {
    console.log((req.body.resetpwd), process.env['resetpwd']);
    req.session.body = req.body;
    res.redirect('/install?err=Bad Combo');
  }
});

router.get('/login', function (req, res, next) {
  if (req.session.uid)
    return res.redirect(req.session.destination || '/contests');

  res.render('login');
});

/** has username and password in body */
function hasUP(req) {
  return req && req.body && req.body.email && req.body.email.length &&
    req.body.password && req.body.password.length;
}

router.post('/login', function (req, res, next) {
  if (!hasUP(req)) { return res.redirect('/login'); }
  var b = req.body;

  // login
  db.util.login(b.email, b.password, function (err, user) {
    // render errors
    if (err) { return next(err); }

    // store user and redirect if necessary
    if (user) {
      req.session.uid = user.id;
      req.session.user = user;
      var redir = req.session.destination || '/login';
      req.session.destination = null;
      return res.redirect(redir);
    }

    // login failure
    res.redirect('/login');
  });
});

router.get('/logout', function(req, res, next) {
  req.session.uid = null;
  req.session.user = null;
  res.redirect('/');
});

/* GET entity pages. */
router.use('/contests', require('./races'));
router.use('/races', (r, s, n) => s.redirect('/contests'));
router.use('/maps', require('./maps'));
router.use('/offices', require('./offices'));
router.use('/candidates', require('./candidates'));

router.use(function (err, req, res, next) {
  if (err.code === 'ER_BAD_DB_ERROR')
    return res.redirect('/install');

  next(err);
});

module.exports = router;
