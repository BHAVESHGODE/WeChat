const express = require('express');
const router = express.Router();
const {
  searchAnime, searchManga, getTrendingAnime, getTrendingManga, getAnimeById, getMangaById,
} = require('../controllers/kitsuController');

router.get('/anime/search', searchAnime);
router.get('/anime/trending', getTrendingAnime);
router.get('/anime/:id', getAnimeById);
router.get('/manga/search', searchManga);
router.get('/manga/trending', getTrendingManga);
router.get('/manga/:id', getMangaById);

module.exports = router;
