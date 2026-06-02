const router = require('express').Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', auth, notificationController.getAll);
router.get('/overdue-tenants', auth, notificationController.overdueTenants);

module.exports = router;
