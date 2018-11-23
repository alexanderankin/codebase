var express = require('express');
var router = express.Router();

var fs = require('fs');

var multer  = require('multer');
var upload = multer({
  dest: require('path').join(__dirname, '..', '..', 'public', 'maps')
});

var db = require('../../db');

router.use(function (req, res, next) {
  if (req.session.uid) {
    return next();
  }
  req.session.destination = req.originalUrl;
  res.redirect('/login');
});

/* GET /maps */
router.get('/', function(req, res, next) {
  var knex = db.getKnex();
  knex('map').select('*').asCallback(function (err, rows) {
    if (err) { return next(err); }

    var maps = rows.map(map => { delete map.notes; return map; });
    res.render('maps', {
      scripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/dropzone/5.5.1/min/dropzone.min.js'
      ],
      stylesheets: [
        'https://cdnjs.cloudflare.com/ajax/libs/dropzone/5.5.1/min/dropzone.min.css'
      ],
      name: req.session.uid,
      maps: maps
    });
  });
});

var getFeatureProperties = require('../../util').getFeatureProperties;

router.get('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('map').select('*').where({ id: req.params.id })
    .asCallback(function (e, rows) {
      if (e) { return next(e); }
      if (!rows || !rows.length) {
        return res.redirect('/maps');
      }

      var map = rows[0];

      knex('map').distinct('level').asCallback(function (e, levels) {
        if (e) { return next(e); }

        levels = levels.reduce(function(a, b) {
          return a.push(b.level), a;
        }, []);
        getFeatureProperties(map.geojson, function (err, properties) {
          if (err) { return next(err); res.redirect('/maps'); }

          res.render('map', {
            scripts: [
              'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js'
            ],
            stylesheets: [
              'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css'
            ],
            name: req.session.uid,
            properties,
            map_title: map.name ? map.name : 'Map #' + map.id,
            map_name: map.name ? map.name : undefined,
            map_key: map.feature_key ? map.feature_key : undefined,
            map_level: map.level ? map.level : undefined,
            levels
          });
        });
      });
    });
});

router.post('/upload', upload.single('file'), function (req, res, next) {
  fs.readFile(req.file.path, 'utf-8', function (err, data) {
    var json;

    // fail if not json
    try {
      json = JSON.parse(data);
    } catch (e) {
      return fs.unlink(req.file.path, function (err) {
        res.status(400).send('Not a GeoJSON');
      });
    }

    // fail if not FeatureCollection
    if (json.type.toLowerCase() !== 'featurecollection')
      return fs.unlink(req.file.path, function (err) {
        res.status(400).send('Not a GeoJSON');
      });

    var knex = db.getKnex();
    knex('map').insert({
      geojson: req.file.filename
    }).asCallback(function (err) {
      if (err) { return next(err); }

      res.status(200).end();
    });
  });
});

router.post('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('map').update({
    name: req.body.name,
    feature_key: req.body.feature_key,
    level: req.body.level
  }).where({ id: req.params.id })
    .asCallback(function (err) {
      res.redirect(req.originalUrl);
    });
});

router.get('/:id/delete', function (req, res, next) {
  var knex = db.getKnex();
  knex('map').del().where({ id: req.params.id }).asCallback(function (e) {
    if (e) { return next(e); }
    res.redirect('/maps');
  });
});


module.exports = router;
