const express = require('express');
const router = express.Router();
const { createNote, getNotesByUser, updateNote, deleteNote } = require('../controllers/noteController');

router.post('/', createNote);
router.get('/:userId', getNotesByUser);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
