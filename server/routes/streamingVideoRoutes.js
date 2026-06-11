const express = require('express');
const router = express.Router();
const {
  searchAnime, getAnimeEpisodes, getVideoLinks, getPopularAnime,
} = require('../controllers/streamingVideoController');

router.get('/search', searchAnime);
router.get('/episodes', getAnimeEpisodes);
router.get('/watch', getVideoLinks);
router.get('/popular', getPopularAnime);

module.exports = router;
