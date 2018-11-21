var express = require('express');
var router = express.Router();

var db = require('../../db');
var getFeatures = require('../../util').getFeatures;

router.use(function (req, res, next) {
  if (req.session.uid) {
    return next();
  }
  req.session.destination = req.originalUrl;
  res.redirect('/login');
});

/* GET /offices */
router.get('/', function(req, res, next) {
  var knex = db.getKnex();
  knex({ o: 'office' })
    .join({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      number: 'o.key',
      level: 'm.level',
    })
    .asCallback(function (err, offices) {
      if (err) { return next(err); }

      res.render('offices', {
        name: req.session.uid,
        offices
      });
    });
});

function getNewOfficeLocals(req, done) {
  var knex = db.getKnex();
  var locals = {};
  // knex('office').distinct('level').then(function (levels) {
  //   locals.levels = levels;
  //   return knex('map').select('id', 'name');
  // })
  knex('map').select('id', 'name').then(function (maps) {
    locals.maps = maps;
    done(null, locals);
  }).catch(done);
}

router.get('/getFeatures/:mapid', function(req, res, next) {
  var knex = db.getKnex();
  knex('map')
    .select('geojson', 'feature_key')
    .where({ id: req.params.mapid })
    .then(function (maps) {
      if (!maps || !maps[0]) { return next(new Error('Bad Map id')); }
      var map = maps[0];

      getFeatures(map.geojson, map.feature_key, function (err, features) {
        if (err) { return next(err); }

        res.json(features.map(feature => {
          return { id: feature, text: feature };
        }));
      });
    })
    .catch(next);
}, function(e, r, s, n) { s.json({ e: e + '' }); });

router.get('/new', function(req, res, next) {
  getNewOfficeLocals(req, function (err, locals) {
    if (err) { return next(err); }

    res.render('newoffice', {
      scripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js'
      ],
      stylesheets: [
        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css'
      ],
      name: req.session.uid,
      ...locals
    });
  });
});

router.post('/new', function (req, res, next) {
  var knex = db.getKnex();
  knex('office').insert({
    map_id: req.body.map,
    key: req.body.region,
    code: req.body.code,
    // notes: ,
  }).asCallback(function (err) {
    if (err) { return next(err); }

    res.redirect(req.originalUrl);
  });
});

router.get('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('office')
    .select('*')
    .where({ id: req.params.id })
    .asCallback(function (err, rows) {
      if (err) { return next(err); }
      if (!rows || !rows[0]) return next(new Error('Bad Office id'));

      res.render('office', {
        office: rows[0],
        name: req.session.uid
      });
    });
});

module.exports = router;
