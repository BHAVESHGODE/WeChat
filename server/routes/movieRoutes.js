const express = require('express');
const router = express.Router();
const {
  searchMovies,
  getMovieById,
  toggleFavorite,
  getFavorites,
  updateWatchlist,
  getWatchlist,
  getRecommendations,
} = require('../controllers/movieController');

router.get('/search', searchMovies);
router.get('/recommendations', getRecommendations);
router.post('/favorites', toggleFavorite);
router.get('/favorites/:userId', getFavorites);
router.post('/watchlist', updateWatchlist);
router.get('/watchlist/:userId', getWatchlist);
router.get('/:id', getMovieById);

module.exports = router;
