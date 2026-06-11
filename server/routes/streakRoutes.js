const express = require('express');
const router = express.Router();
const { logSession, getStreaks, recordTaskComplete, getBadges } = require('../controllers/streakController');

router.post('/session', logSession);
router.post('/task-complete', recordTaskComplete);
router.get('/:userId', getStreaks);
router.get('/:userId/badges', getBadges);

module.exports = router;
