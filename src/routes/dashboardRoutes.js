const router = require('express').Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', auth, dashboardController.getStats);
router.get('/overdue', auth, dashboardController.getOverdue);

module.exports = router;
