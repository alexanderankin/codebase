var md5 = require('md5');
var bcrypt = require('bcrypt-nodejs');

var knexRe = require('./index');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

function salt(string) {
  return md5(string + process.env['password_salt']);
}

/**
 * Register a new user with callback
 * 
 * Possible errors if bcrypt err's, if ER_DUP_ENTRY, or other DB error.
 * 
 * @param username the new username to register
 * @param password the plaintext password
 * @param done callback(err)
 */
function registerUser(username, password, done) {
  bcrypt.hash(password, null, null, function (err, passwordHash) {
    if (err) { return done(new Error('bcrypt hash error')); }
    var knex = knexRe.getKnex();
    knex('organizer').insert({ username, passwordHash })
      .then(done)
      .catch(function (err) {
        if (err.code == 'ER_DUP_ENTRY')
          return done(new Error('Duplicate User'));

        done(err);
      });
  })
}

// registerUser("meijewef", "ok", function (err) {
//   if (err) { console.log("gotcha 26"); throw err; }
// });

/**
 * login using credentials
 * 
 * @param username username to login as
 * @param password the plaintext password to compare
 * @param done callback(err, user or false)
 */
function login(username, password, done) {
  var knex = knexRe.getKnex();
  knex('organizer').select('*').where({ username }).then(function (rows) {
    if (rows.length == 0) { return done(null, false); }
    if (rows.length != 1) { return done(new Error('Multiple usernames')); }

    var user = rows[0];
    bcrypt.compare(password, user.passwordHash, function (err, valid) {
      if (err) return done(new Error('Bcrypt threw an error'));

      done(null, valid ? user : valid);
    });
  }).catch(function (err) {
    if (err.code == 'ER_NO_SUCH_TABLE')
      return done(new Error('No such table'));

    done(err);
  });
}

// login('me', 'okk', function (e) {
//   console.log("GOTCHA");
//   if (e) throw e;
// })

module.exports = { registerUser, login };
