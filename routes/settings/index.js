var express = require('express');
var router = express.Router();

/* GET /settings */
router.get('/', function (req, res, next) {
  res.render('settings');
})

module.exports = router;
