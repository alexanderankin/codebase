var express = require('express');
var router = express.Router();

var moment = require('moment');

var db = require('../../db');

router.use(function (req, res, next) {
  if (req.session.uid) {
    return next();
  }
  req.session.destination = req.originalUrl;
  res.redirect('/login');
});

/* GET /races */
router.get('/', function(req, res, next) {
  var knex = db.getKnex();
  knex({ r: 'race' })
    .leftOuterJoin({ o: 'office' }, 'o.id', 'r.office_id')
    .select({
      id: 'r.id',
      time: 'r.time',
      // office_id: 'o.id',
      office: 'o.code'
    })
    .asCallback(function (err, races) {
      if (err) { return next(err); }

      races = races.map(function (race) {
        race.time = [

          moment(race.time).format('MMMM Do YYYY'),
          ' (', moment(race.time).fromNow(), ')'
        ].join('');
        return race;
      });

      res.render('races', {
        name: req.session.uid,
        races
      });
    });
});

/**
 * Take care of a single office
 */
function formatOfficeDropDown(office, index, array, office_id_name) {
  function s(str) {
    // https://stackoverflow.com/questions/831552/ellipsis-in-the-middle-of
    // -a-text-mac-style
    function smartTrim(string, maxLength) {
      if (!string) return string;
      if (maxLength < 1) return string;
      if (string.length <= maxLength) return string;
      if (maxLength == 1) return string.substring(0,1) + '...';

      var midpoint = Math.ceil(string.length / 2);
      var toremove = string.length - maxLength;
      var lstrip = Math.ceil(toremove/2);
      var rstrip = toremove - lstrip;
      return string.substring(0, midpoint-lstrip) + '...' 
      + string.substring(midpoint+rstrip);
    }

    return smartTrim(str, 15);
  }

  return {
    id: (office_id_name ? office[office_id_name] : office.id),
    text: [
      s(office.code),
      s(office.type),
      s(office.district),
    ].join(' : ')
  }
}

function getNewRouteInfo(done) {
  var knex = db.getKnex();
  var info = {};
  knex({ o: 'office' })
    .join({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      district: 'o.key'
    }).then((offices) => {
      info['offices'] = offices.map(formatOfficeDropDown);
      done(null, info);
    }).catch(done);
}

router.get('/new', function (req, res, next) {
  getNewRouteInfo(function (err, info) {
    if (err) { return next(err); }
    res.render('newrace', {
      scripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js'
      ],
      stylesheets: [
        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css'
      ],
      name: req.session.uid,
      ...info
    });
  })
});

router.post('/new', function (req, res, next) {
  var knex = db.getKnex();
  knex('race').insert({
    time: req.body.time ? req.body.time : null,
    office_id: req.body.office ? req.body.office : null
  }).asCallback(function (err) {
    if (err) { return next(err); }
    res.redirect('/races');
  });
});

router.get('/:id/add/:candidate_id', function (req, res, next) {
  var knex = db.getKnex();
  knex('race_candidate').insert({
    race_id: req.params.id,
    candidate_id: req.params.candidate_id
  }).asCallback(function (err) {
    if (err) { return next(err); }
    res.redirect('/races/' + req.params.id);
  });
});

router.get('/:id', function (req, res, next) {
  var knex = db.getKnex();
  var race = knex({ r: 'race' })
    .join({ o: 'office' }, 'o.id', 'r.office_id')
    .join({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'r.id',
      time: 'r.time',

      // office info
      office_id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      district: 'o.key'
    })
    .where({ 'r.id': req.params.id });

  var offices = knex({ o: 'office' })
    .join({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      district: 'o.key'
    });

  var candidates = knex('candidate').select('*');
  var rcs = knex({ r: 'race' })
    .join({ rc: 'race_candidate'}, 'rc.race_id', 'r.id')
    .join({ c: 'candidate'}, 'c.id', 'rc.candidate_id')
    .select('c.*')
    .where({ 'r.id': req.params.id });

  Promise.all([ race, offices, candidates, rcs ]).then(function (values) {
    // unpack
    var [ races, offices, candidates, rcs ] = values;

    // 404
    if (!races || !races[0]) { return next(new Error('Bad Race id param.')); }
    var race = races[0];

    // format variables
    race.office = formatOfficeDropDown(race, null, null, 'office_id');

    // https://stackoverflow.com/a/15301874
    if (race.time) {
      moment(race.time).format('YYYY-MM-DD');
    }

    offices = offices.map(formatOfficeDropDown);

    res.render('race', {
      scripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js'
      ],
      stylesheets: [
        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css'
      ],
      name: req.session.uid,
      race,
      offices,
      office_id: race.office.id,
      candidates,
      race_candidates: rcs
    });
  });
});

router.post('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('race').update({
    office_id: req.body.office ? req.body.office : null,
    time: req.body.time ? req.body.time : null
  }).asCallback(function (err) {
    if (err) { return next(err); }
    res.redirect(req.originalUrl);
  });
});

module.exports = router;
