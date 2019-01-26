var express = require('express');
var router = express.Router();

var db = require('../../db');
var hash = require('../../db/util').hash;
var wipe = require('../../db/install').wipe;
var updateEnv = require('../../util').updateEnv;
var util = require('../../util');

router.use(util.ensureLoginMiddleware);

/* GET /settings page. */
router.get('/', function(req, res, next) {
  res.render('settings/index');
});

/* GET profile page. Uses data from Login MW. */
router.get('/profile', function(req, res, next) {
  res.render('settings/profile');
});

router.post('/profile', function (req, res, next) {
  var newPassword = undefined;
  if (req.body.password1) {
    if (req.body.password1 === req.body.password2) {
      newPassword = req.body.password1;
      req.flash('success', 'Password set successfully');
    } else {
      req.flash('error', 'Passwords did not match');
    }
  }

  var knex = db.getKnex();
  knex('organizer')
    .update({
      name: req.body.name,
      username: req.body.email,
      password: newPassword,
      phone: req.body.phone
    })
    .where({ id: req.session.uid })
    .then(function () {
      res.redirect(req.originalUrl);
    })
    .catch(next);
});

/* GET database page. */
router.get('/database', function(req, res, next) {
  res.render('settings/database');
});

/* GET organizers page. */
router.get('/organizers', function(req, res, next) {
  res.render('settings/organizers', {
    codeUrl: 'http://ok.go'
  });
});

router.post('/onboard', function (req, res, next) {
  console.log(body);
  res.redirect('/settings/organizers');
});

module.exports = router;
