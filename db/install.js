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
