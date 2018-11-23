var knexRe = require('./index');

function wipe(done) {
  var db = knexRe.getKnex();
  db.schema
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
      t.string('password', 32);
      t.string('name');
      t.string('email');
      t.string('phone');
    })

    .dropTableIfExists('race_candidate')
    .dropTableIfExists('race')
    .dropTableIfExists('office')
    .dropTableIfExists('map')
    .createTable('map', function(t) {
      t.increments('id');
      t.string('name');
      t.string('geojson', 500);
      t.string('feature_key');
      t.string('level');  // federal, state, county, city, school, MDJ
      t.string('notes', 1000);
    })

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

    .createTable('race', function (t) {
      t.increments('id');
      t.integer('year');
      t.integer('time').unsigned().references('id').inTable('election_time').notNullable();
      t.integer('office_id').unsigned().references('id').inTable('office').onDelete('set null');
      t.string('notes', 1000);
    })

    .createTable('race_candidate', function (t) {
      t.integer('race_id').unsigned().references('id').inTable('race').onDelete('set null').notNullable();
      t.integer('candidate_id').unsigned().references('id').inTable('candidate').onDelete('set null').notNullable();
      t.unique([ 'race_id', 'candidate_id' ]);
    })

    .asCallback(function (err, result) {
      db('election_time').insert([
        { name: 'Primary', code: 'P' },
        { name: 'General', code: 'G' },
        { name: 'Special', code: 'S' },
      ]).asCallback(function (err) {
        if (err) { return done(err); }

        knexRe.destroy(function () {
          if (err) { return done(err); }
          done();
        });
      });
    });
}

  wipe(function (err) {
  if (err) { throw err; }
  console.log("Database", process.env['mysqldb'], 'reset.');
});

module.exports = {
  wipe
};
