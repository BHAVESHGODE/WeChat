const express = require('express');
const router = express.Router();
const {
  upsertProgress, getProgress, getSingleProgress, deleteProgress, batchUpdateProgress,
} = require('../controllers/progressController');

router.get('/', getProgress);
router.get('/single', getSingleProgress);
router.post('/', upsertProgress);
router.post('/batch', batchUpdateProgress);
router.delete('/', deleteProgress);

module.exports = router;
