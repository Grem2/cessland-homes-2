const router = require('express').Router();
const auth = require('../middleware/auth');
const penaltyController = require('../controllers/penaltyController');

router.post('/run', auth, penaltyController.run);

module.exports = router;
