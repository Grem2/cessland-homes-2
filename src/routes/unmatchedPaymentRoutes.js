const router = require('express').Router();
const auth = require('../middleware/auth');
const unmatchedPaymentController = require('../controllers/unmatchedPaymentController');

router.get('/', auth, unmatchedPaymentController.getAll);
router.post('/:id/allocate', auth, unmatchedPaymentController.allocate);

module.exports = router;
