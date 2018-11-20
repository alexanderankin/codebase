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

    .dropTableIfExists('map')
    .dropTableIfExists('region')
    .createTable('map', function(t) {
      t.increments('id');
      t.string('geojson', 500);
      t.string('feature_key');
      t.string('notes', 1000);
    })
    .createTable('region', function(t) {
      t.increments('id');
      t.integer('map_id').references('id').inTable('map');
      t.string('notes', 1000);
    })

    .asCallback(function (err, result) {
      knexRe.destroy(done);
    });
}

wipe(function () {
  console.log("Database", process.env['mysqldb'], 'reset.');
});

module.exports = {
  wipe
};
