var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title: 'Express' });
});

/* GET home page. */
router.get('/int', function(req, res, next) {
  res.render('interface', {
    title: 'Express',
    name: 'John'
  });
});

module.exports = router;
