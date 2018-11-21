var express = require('express');
var router = express.Router();

router.use(function (req, res, next) {
  if (req.session.uid) {
    return next();
  }
  req.session.destination = req.originalUrl;
  res.redirect('/login');
});

/* GET /races */
router.get('/', function(req, res, next) {
  res.render('races', {
    name: req.session.uid
  });
});

router.get('/new', function (req, res, next) {
  res.render('newrace', {
    name: req.session.uid

  });
});

module.exports = router;
