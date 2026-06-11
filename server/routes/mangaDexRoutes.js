const express = require('express');
const router = express.Router();
const {
  searchMangaDex, getMangaById, getMangaChapters,
  getChapterPages, getMangaGenres, getMangaList,
} = require('../controllers/mangaDexController');

router.get('/search', searchMangaDex);
router.get('/list', getMangaList);
router.get('/genres', getMangaGenres);
router.get('/:id', getMangaById);
router.get('/:id/chapters', getMangaChapters);
router.get('/chapter/:id/pages', getChapterPages);

module.exports = router;
