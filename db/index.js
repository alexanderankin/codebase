var knexRe = require('knex-reconnector');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

module.exports = new knexRe({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: process.env['mysqlu'],
    password: process.env['mysqlp'],
    database: process.env['mysqldb']
  }
});

// module.exports.getKnex().on('query', q => console.log(q.sql));
