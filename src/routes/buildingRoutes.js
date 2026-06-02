const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const buildingController = require('../controllers/buildingController');

const upload = multer({ dest: 'uploads/' });

router.get('/', auth, buildingController.getAll);
router.get('/:id', auth, buildingController.getById);
router.post('/', auth, buildingController.create);
router.put('/:id', auth, buildingController.update);
router.delete('/:id', auth, buildingController.remove);
router.post('/import', auth, upload.single('file'), buildingController.importExcel);

module.exports = router;
