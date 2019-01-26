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
      mysqlu: req.body.mysqlu || process.env['mysqlu'],
      mysqlp: req.body.mysqlp || process.env['mysqlp'],
      mysqldb: req.body.mysqldb || process.env['mysqldb'],
    });

    updateEnv(req.body, function (err) {
      console.log('Error updating .env:', err + '');
    });

    db.reset({
      client: 'mysql',
      connection: {
        host: '127.0.0.1',
        user: process.env['mysqlu'],
        password: process.env['mysqlp'],
        database: process.env['mysqldb']
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
  if (!hasUP(req)) {
    req.flash('login_error', 'One or more fields left blank');
    return res.redirect('/login');
  }

  var knex = db.getKnex();
  knex({ u: 'organizer' })
    .select({ uid: 'u.id' })
    .where('u.username', req.body.email)
    .where('u.password', hash(req.body.password))
    .asCallback(function (err, result) {
      if (err) { return next(err); }
      
      if (result.length === 1) {
        req.session.uid = result.pop().uid;
        var redir = req.session.destination || '/contests';
        req.session.destination = null;
        return res.redirect(redir);
      }

      req.flash('login_error', 'Bad Combo');
      res.redirect('/login');
    });
});

router.get('/logout', function(req, res, next) {
  req.session.uid = null;
  res.redirect('/');
});

/* GET entity pages. */
router.use('/contests', (r, s, n) => s.redirect('/races'));
router.use('/maps', require('./maps'));
router.use('/offices', require('./offices'));
router.use('/candidates', require('./candidates'));
router.use('/races', require('./races'));

/* user specific pages */
router.use('/settings', require('./settings'));

router.use(function (err, req, res, next) {
  if (err.code === 'ER_BAD_DB_ERROR')
    return res.redirect('/install');

  next(err);
});

module.exports = router;
