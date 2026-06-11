const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { searchByImage, searchByUrl } = require('../controllers/traceController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `trace-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|bmp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files (jpg, png, gif, webp, bmp) are allowed'));
  },
});

router.post('/search', upload.single('image'), searchByImage);
router.post('/search-url', searchByUrl);

module.exports = router;
