const express = require('express');
const router = express.Router();
const { searchManga, getMangaDetail, getChapterPages } = require('../controllers/comikController');

router.get('/search', searchManga);
router.get('/:slug/chapter/:chapterId', getChapterPages);
router.get('/:slug', getMangaDetail);

module.exports = router;
