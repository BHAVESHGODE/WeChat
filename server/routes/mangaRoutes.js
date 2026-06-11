const express = require('express');
const router = express.Router();
const {
  searchManga,
  getTopManga,
  getMangaById,
  getMangaCharacters,
  getMangaRecommendations,
  getMangaGenres,
} = require('../controllers/mangaController');

router.get('/search', searchManga);
router.get('/top', getTopManga);
router.get('/genres', getMangaGenres);
router.get('/:id', getMangaById);
router.get('/:id/characters', getMangaCharacters);
router.get('/:id/recommendations', getMangaRecommendations);

module.exports = router;
