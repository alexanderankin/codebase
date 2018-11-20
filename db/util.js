var md5 = require('md5');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

function salt(string) {
  return md5(string + process.env['password_salt']);
}

module.exports = { hash: salt };
