var express = require('express');
var router = express.Router();

router.get('/view/:viewname', function (req, res) {
  res.render(req.params.viewname);
});

module.exports = router;
