var express = require('express');
var router = express.Router();

var util = require('../../util');

router.use(util.ensureLoginMiddleware);

/* GET /regions */
router.get('/', function(req, res, next) {
  res.render('interface', { name: req.session.uid });
});

module.exports = router;
