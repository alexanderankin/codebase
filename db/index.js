var knexRe = require('knex-reconnector');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

module.exports = new knexRe({
  client: 'mysql',
  connection: {
    host: process.env['MYSQL_HOST'],
    user: process.env['MYSQL_USER'],
    password: process.env['MYSQL_PASSWORD'],
    database: process.env['MYSQL_DATABASE']
  }
});

module.exports.util = require('./util');

// module.exports.getKnex().on('query', q => console.log(q.sql));
