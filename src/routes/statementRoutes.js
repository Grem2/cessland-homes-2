const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const statementController = require('../controllers/statementController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'statements');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/upload', auth, upload.single('statement'), statementController.upload);
router.post('/process-folder', auth, statementController.processFolder);

module.exports = router;
