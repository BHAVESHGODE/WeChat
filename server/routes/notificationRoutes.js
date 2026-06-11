const express = require('express');
const router = express.Router();
const { dailyQuote, getUpcomingReminders } = require('../controllers/notificationController');

router.get('/quote', dailyQuote);
router.get('/reminders/:userId', getUpcomingReminders);

module.exports = router;
