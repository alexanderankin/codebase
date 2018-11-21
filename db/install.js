var knexRe = require('./index');

function wipe(done) {
  var db = knexRe.getKnex();
  db.schema
    .dropTableIfExists('organizer')
    .createTable('organizer', function (t) {
      t.increments('id');
      t.string('username').notNull().unique();
      t.string('password', 32);
      t.string('name');
      t.string('email');
      t.string('phone');
    })

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
      t.integer('map_id').unsigned().references('id').inTable('map');
      t.string('key');  // feature.properties[map.feature_key]
      t.string('code');  // slug
      t.string('notes', 1000);
    })

    .asCallback(function (err, result) {
      knexRe.destroy(function () {
        if (err) { return done(err); }
        done();
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
