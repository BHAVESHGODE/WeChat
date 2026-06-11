const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
} = require('../controllers/favoriteController');

router.post('/', addFavorite);
router.delete('/', removeFavorite);
router.get('/check', checkFavorite);
router.get('/:userId', getFavorites);

module.exports = router;
