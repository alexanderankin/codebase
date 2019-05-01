var knexRe = require('./index');

var hash = require('./util').hash;

function wipe(done) {
  var db = knexRe.getKnex();
  db.raw('SET FOREIGN_KEY_CHECKS = 0;').then(function () {
    return db.schema
      .dropTableIfExists('election_time')
      .createTable('election_time', function (t) {
        t.increments();
        t.string('name');
        t.string('code', 20);
      })

      .dropTableIfExists('organizer')
      .createTable('organizer', function (t) {
        t.increments('id');
        t.string('username').notNull().unique();
        t.string('passwordHash', 60);
        t.string('name');
        t.string('email');
        t.string('phone');
      })

      .dropTableIfExists('map')
      .createTable('map', function(t) {
        t.increments('id');
        t.string('name');
        t.string('geojson', 500);
        t.string('feature_key');
        t.string('level');  // federal, state, county, city, school, MDJ
        t.string('notes', 1000);
      })

      .dropTableIfExists('office')
      .createTable('office', function (t) {
        t.increments('id');
        t.integer('map_id').unsigned().references('id').inTable('map').onDelete('set null');
        t.string('key');  // feature.properties[map.feature_key]
        t.string('code');  // slug
        t.string('notes', 1000);
      })

      .dropTableIfExists('candidate')
      .createTable('candidate', function (t) {
        t.increments();
        t.string('name');
        t.integer('age');
        t.string('phone');
        t.string('email');
      })

      .dropTableIfExists('race')
      .createTable('race', function (t) {
        t.increments('id');
        t.integer('year');
        t.integer('time').unsigned().references('id').inTable('election_time').notNullable();
        t.integer('office_id').unsigned().references('id').inTable('office').onDelete('set null');
        t.string('notes', 1000);
        t.unique([ 'year', 'time', 'office_id' ]);
      })

      .dropTableIfExists('race_candidate')
      .createTable('race_candidate', function (t) {
        t.increments();
        t.integer('race_id').unsigned().references('id').inTable('race').onDelete('set null');
        t.integer('candidate_id').unsigned().references('id').inTable('candidate').onDelete('set null');
        t.unique([ 'race_id', 'candidate_id' ]);
      });
  }).then(function () {
    return db.raw('SET FOREIGN_KEY_CHECKS = 1;');
  }).then(function () {
    return db('election_time').insert([
      { name: 'Primary', code: 'P' },
      { name: 'General', code: 'G' },
      { name: 'Special', code: 'S' },
    ]);
  }).asCallback(function (err) {
    if (err) { return done(err); }

    knexRe.destroy(function () {
      if (err) { return done(err); }
      done();
    });
  });
}

module.exports = {
  wipe
};
