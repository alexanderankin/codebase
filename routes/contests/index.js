var express = require('express');
var router = express.Router();

router.use(function (req, res, next) {
  console.log(req.session);
  req.session.times = req.session.times ? req.session.times + 1 : 1;
  next();
})

/* GET /contests */
router.get('/', function(req, res, next) {
  res.render('interface', { name: 'john' });
});

module.exports = router;
