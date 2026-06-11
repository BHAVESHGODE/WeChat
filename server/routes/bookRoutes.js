const express = require('express');
const router = express.Router();
const {
  searchBooks, getBookById, getBookText, getRelatedBooks,
  saveProgress, addBookmark, removeBookmark,
  addHighlight, removeHighlight, getProgress, deleteProgress,
} = require('../controllers/bookController');

router.get('/search', searchBooks);
router.get('/related', getRelatedBooks);
router.get('/text/:id', getBookText);
router.get('/progress', getProgress);
router.post('/progress', saveProgress);
router.delete('/progress', deleteProgress);
router.post('/bookmark', addBookmark);
router.delete('/bookmark', removeBookmark);
router.post('/highlight', addHighlight);
router.delete('/highlight', removeHighlight);
router.get('/:id', getBookById);

module.exports = router;
