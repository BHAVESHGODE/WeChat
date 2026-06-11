const express = require('express');
const router = express.Router();
const {
  searchAnime,
  getTopAnime,
  getAnimeById,
  getAnimeCharacters,
  getAnimeReviews,
  getAnimeRecommendations,
  getSeasonalAnime,
  getAnimeSchedules,
  getAnimeGenres,
} = require('../controllers/animeController');

router.get('/search', searchAnime);
router.get('/top', getTopAnime);
router.get('/genres', getAnimeGenres);
router.get('/seasonal', getSeasonalAnime);
router.get('/schedules', getAnimeSchedules);
router.get('/:id', getAnimeById);
router.get('/:id/characters', getAnimeCharacters);
router.get('/:id/reviews', getAnimeReviews);
router.get('/:id/recommendations', getAnimeRecommendations);

module.exports = router;
