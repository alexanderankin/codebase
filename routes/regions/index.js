var express = require('express');
var router = express.Router();

router.use(function (req, res, next) {
  if (req.session.uid) {
    return next();
  }
  req.session.destination = req.path;
  res.redirect('/login');
});

/* GET /regions */
router.get('/', function(req, res, next) {
  res.render('interface', { name: req.session.uid });
});

module.exports = router;
