const router = require('express').Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.get('/', auth, paymentController.getAll);
router.post('/', auth, paymentController.createManual);

module.exports = router;
