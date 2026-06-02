const router = require('express').Router();
const auth = require('../middleware/auth');
const auditLogController = require('../controllers/auditLogController');

router.get('/', auth, auditLogController.getAll);

module.exports = router;
