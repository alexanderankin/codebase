var express = require('express');
var router = express.Router();

var db = require('../../db');
var util = require('../../util');

router.use(util.ensureLoginMiddleware);

/* GET /candidates */
router.get('/', function(req, res, next) {
  var knex = db.getKnex();
  knex('candidate').select('*').asCallback(function (err, candidates) {
    if (err) return next(err);

    res.render('entities/candidates', {
      name: req.session.uid,
      candidates
    });
  });
});

router.get('/new', function (req, res, next) {
  res.render('entities/newcandidate', {
    name: req.session.uid

  });
});

router.post('/new', function (req, res, next) {
  var knex = db.getKnex();
  knex('candidate').insert({
    name: req.body.name ? req.body.name : null,
    age: req.body.age ? req.body.age : null,
    phone: req.body.phone ? req.body.phone : null,
    email: req.body.email ? req.body.email : null,
  }).asCallback(function (err) {
    if (err) { return next(err); }

    res.redirect('/candidates');
  });
});

router.get('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('candidate').select('*').where({ id: req.params.id })
    .asCallback(function (err, rows) {
      if (err) { return next(err); }
      if (!rows || !rows[0]) { return next(new Error('Bad candidate id')); }
      
      res.render('entities/candidate', {
        candidate: rows[0],
        name: req.session.uid
      });
    });
});

router.post('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('candidate').update({
    name: req.body.name ? req.body.name : null,
    age: req.body.age ? req.body.age : null,
    phone: req.body.phone ? req.body.phone : null,
    email: req.body.email ? req.body.email : null,
  }).where({ id: req.params.id }).asCallback(function (err) {
    if (err) { return next(err); }
    
    res.redirect(req.originalUrl);
  });
});

module.exports = router;
