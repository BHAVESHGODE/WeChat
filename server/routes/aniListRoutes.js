const express = require('express');
const router = express.Router();
const {
  searchAnimeAL, searchMangaAL, getTrending, getMediaById,
} = require('../controllers/aniListController');

router.get('/anime/search', searchAnimeAL);
router.get('/manga/search', searchMangaAL);
router.get('/trending', getTrending);
router.get('/media/:id', getMediaById);

module.exports = router;
