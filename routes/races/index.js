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
    .leftOuterJoin({ et: 'election_time' }, 'et.id', 'r.time')
    .leftOuterJoin({ o: 'office' }, 'o.id', 'r.office_id')
    .select({
      id: 'r.id',
      year: 'r.year',
      etname: 'et.name',
      etcode: 'et.code',
      // office_id: 'o.id',
      office: 'o.code'
    }).then(function (races) {
      return races.map(function (race) {
        var office = race.office;
        delete race.office;

        race.time = [ race.etname, ' (', race.etcode, ')' ].join('');
        delete race.etname;
        delete race.etcode;

        race.office = office;

        return race;
      });
    })
    .asCallback(function (err, races) {
      if (err) { return next(err); }

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
  var offices = knex({ o: 'office' })
    .leftOuterJoin({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      district: 'o.key'
    }).then((offices) => {
      return offices.map(formatOfficeDropDown);
    });

  var electionTimes = knex('election_time')
    .select('id', 'name', 'code')
    .then(function (elections) {
      return elections.map(function (el) {
        var text = [ el.name, ' (', el.code, ')' ].join('');
        return { id: el.id, text };
      });
    });

  Promise.all([ offices, electionTimes ]).then(function (values) {
    var [ offices, election_times ] = values;
    done(null, { offices, election_times });
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
    time: req.body.election_time ? req.body.election_time : null,
    year: req.body.year ? req.body.year : null,
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
    .leftOuterJoin({ o: 'office' }, 'o.id', 'r.office_id')
    .leftOuterJoin({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'r.id',
      time: 'r.time',

      // office info
      office_id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      district: 'o.key'
    })
    .where({ 'r.id': req.params.id })
    .then(function (races) {
      if (!races || !races[0]) { throw new Error('Bad Race id param.'); }
      return races[0];
    })
    .then(function (race) {
      race.office = formatOfficeDropDown(race, null, null, 'office_id');
      return race;
    });

  var offices = knex({ o: 'office' })
    .leftOuterJoin({ m: 'map' }, 'm.id', 'o.map_id')
    .select({
      id: 'o.id',
      code: 'o.code',
      type: 'm.name',
      district: 'o.key'
    }).then(function (offices) {
      return offices.map(formatOfficeDropDown);
    })

  var ets = knex('election_time').select('*').then(function (ets) {
    return ets.map(function (et) {
      return { id: et.id, text: [ et.name + ' (' + et.code + ')' ].join('') };
    });
  });

  var candidates = knex('candidate').select('*');
  var rcs = knex({ r: 'race' })
    .join({ rc: 'race_candidate'}, 'rc.race_id', 'r.id')
    .join({ c: 'candidate'}, 'c.id', 'rc.candidate_id')
    .select('c.*')
    .where({ 'r.id': req.params.id });

  Promise.all([ race, offices, candidates, rcs, ets ]).then(function (values) {
    var [ race, offices, cands, rcs, ets ] = values;
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
      election_time_id: race.time,
      candidates: cands,
      race_candidates: rcs,
      election_times: ets
    });
  }).catch(next);
});

router.post('/:id', function (req, res, next) {
  var knex = db.getKnex();
  knex('race').update({
    office_id: req.body.office ? req.body.office : null,
    time: req.body.election_time ? req.body.election_time : null
  }).asCallback(function (err) {
    if (err) { return next(err); }
    res.redirect(req.originalUrl);
  });
});

module.exports = router;
