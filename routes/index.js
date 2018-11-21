var express = require('express');
var router = express.Router();

var db = require('../db');
var hash = require('../db/util').hash;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
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

  var knex = db.getKnex();
  knex({ u: 'organizer' })
    .select({ uid: 'u.id' })
    .where('u.username', req.body.email)
    .where('u.password', hash(req.body.password))
    .asCallback(function (err, result) {
      if (err) { return next(err); }
      
      if (result.length === 1) {
        req.session.uid = result.pop().uid;
        var redir = req.session.destination || '/login';
        req.session.destination = null;
        return res.redirect(redir);
      }

      res.redirect('/login');
    });
});

router.get('/logout', function(req, res, next) {
  req.session.uid = null;
  res.redirect('/');
});

/* GET entity pages. */
router.use('/contests', require('./contests'));
router.use('/maps', require('./maps'));
router.use('/offices', require('./offices'));
router.use('/races', require('./races'));

module.exports = router;
