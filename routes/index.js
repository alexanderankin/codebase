var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});

/* GET home page. */
router.use('/contests', require('./contests'));

module.exports = router;
