var express = require('express');
var router = express.Router();

var db = require('../db');
var dbutil = require('../db/util');
var wipe = require('../db/install').wipe;
var util = require('../util');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});

router.get('/install', function (req, res, next) {
  res.locals.session = req.session || {};
  res.locals.query = req.query || {};
  res.render('install');
});

/**
 * 
 */
router.post('/install', function (req, res, next) {
  var b = req.body;

  // only allow this code to be run if not yet installed
  var installed = util.existsEnv();
  if (!installed) {
    // update process environment variables
    process.env = Object.assign(process.env, {
      MYSQL_USER    : b['MYSQL_USER']     || process.env['MYSQL_USER'],
      MYSQL_PASSWORD: b['MYSQL_PASSWORD'] || process.env['MYSQL_PASSWORD'],
      MYSQL_DATABASE: b['MYSQL_DATABASE'] || process.env['MYSQL_DATABASE'],
      MYSQL_HOST    : b['MYSQL_HOST']     || process.env['MYSQL_HOST'],
    });

    // create .env file
    util.updateEnv(req.body, function (err) {
      console.log('Error updating .env:', err + '');
    });

    db.reset({
      client: 'mysql',
      connection: {
        host: process.env['MYSQL_HOST'] || 'localhost',
        user: process.env['MYSQL_USER'],
        password: process.env['MYSQL_PASSWORD'],
        database: process.env['MYSQL_DATABASE']
      }
    }, function () {
      req.session.body = null;

      // if install option is checked on form
      if (b.install !== 'on')
        return res.redirect('/');

      wipe(err => {
        console.log(err);
        if (err) { err.skip = true; return next(err); }
        return res.redirect('/');
      });
    });
  }

  else {
    req.session.body = req.body;
    res.redirect('/install?err=Already installed, refusing to overwrite');
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
    .select({ uid: 'u.id'})
    .select({ name: 'u.name' })
    .select({ password: 'u.password' })
    .where('u.username', req.body.email)
    .asCallback(function (err, result) {
      if (err) { return next(err); }

      if (result.length === 1) {
        var user = result.pop();
        console.log('verifying', req.body.password, user.password);
        dbutil.verify(req.body.password, user.password, function (e, valid) {
          if (e) { return next(e); }
          if (valid) {
            req.session.uid = user.uid;
            req.session.user = user;
            var redir = req.session.destination || '/contests';
            req.session.destination = null;
            return res.redirect(redir);
          }

          // exists user no password
          else {
            req.flash('login_error', 'Bad Combo');
            res.redirect('/login');
          }
        });

        return;
      }

      // result is empty or duplicate user error
      req.flash('login_error', 'Bad Combo');
      res.redirect('/login');
    });
});

router.get('/logout', function(req, res, next) {
  req.session.uid = null;
  req.session.user = null;
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
