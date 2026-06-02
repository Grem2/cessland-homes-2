const router = require('express').Router();
const auth = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

router.get('/', auth, invoiceController.getAll);
router.get('/tenant/:tenantId', auth, invoiceController.getTenantInvoices);
router.post('/generate', auth, invoiceController.generate);

module.exports = router;
