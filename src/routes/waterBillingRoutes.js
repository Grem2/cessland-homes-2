const router = require('express').Router();
const auth = require('../middleware/auth');
const waterBillingController = require('../controllers/waterBillingController');

router.get('/', auth, waterBillingController.getAll);
router.post('/', auth, waterBillingController.createReading);

module.exports = router;
