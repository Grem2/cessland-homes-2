const router = require('express').Router();
const auth = require('../middleware/auth');
const settingController = require('../controllers/settingController');

router.get('/', auth, settingController.getAll);
router.put('/', auth, settingController.upsert);

module.exports = router;
