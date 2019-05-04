var bcrypt = require('bcryptjs');

function verify(given, stored, done) {
  hash(given, function (err, hashed) {
    if (err) { return done(err); }
    bcrypt.compare(hashed, stored, done);
  });
}

function hash(password, done) {
  bcrypt.hash(password, 12, done);
}

module.exports = { hash, verify };
