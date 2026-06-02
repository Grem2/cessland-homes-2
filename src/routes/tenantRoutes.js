const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const tenantController = require('../controllers/tenantController');

const upload = multer({ dest: 'uploads/' });

router.get('/', auth, tenantController.getAll);
router.get('/:id', auth, tenantController.getById);
router.post('/', auth, tenantController.create);
router.put('/:id', auth, tenantController.update);
router.delete('/:id', auth, tenantController.remove);
router.post('/:id/sd-payment', auth, tenantController.addSdPayment);
router.post('/import', auth, upload.single('file'), tenantController.importExcel);

module.exports = router;
