const express = require('express');
const router = express.Router();
const {
  searchManga, getMangaList, getMangaDetail, getChapterPages,
} = require('../controllers/asuraScansController');

router.get('/search', searchManga);
router.get('/list', getMangaList);
router.get('/:id/chapter/:chapter', getChapterPages);
router.get('/:id', getMangaDetail);

module.exports = router;
