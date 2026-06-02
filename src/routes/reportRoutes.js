const router = require('express').Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/collections', auth, reportController.collections);
router.get('/aging', auth, reportController.aging);

module.exports = router;
