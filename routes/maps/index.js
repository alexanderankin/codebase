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
  req.session.destination = req.path;
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

module.exports = router;
