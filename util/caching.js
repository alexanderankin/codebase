var NodeCache = require('node-cache');

module.exports = new NodeCache({ stdTTL: 20, checkperiod: 30 });
