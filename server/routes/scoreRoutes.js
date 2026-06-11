const express = require('express');
const router = express.Router();
const { getScores, getLeaderboard, saveScore, deleteScore, getStats, resetScores } = require('../controllers/scoreController');

router.post('/', saveScore);
router.get('/:userId', getScores);
router.get('/:userId/stats', getStats);
router.get('/leaderboard/:game', getLeaderboard);
router.delete('/:id', deleteScore);
router.post('/reset', resetScores);

module.exports = router;
