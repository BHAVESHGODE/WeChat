const express = require('express');
const router = express.Router();
const {
  addToWatchList, updateWatchListEntry, removeFromWatchList,
  getWatchList, checkWatchList,
} = require('../controllers/watchListController');

router.post('/', addToWatchList);
router.put('/', updateWatchListEntry);
router.delete('/', removeFromWatchList);
router.get('/', getWatchList);
router.get('/check', checkWatchList);

module.exports = router;
