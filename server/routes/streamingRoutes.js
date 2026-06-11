const express = require('express');
const router = express.Router();
const { getStreamingLinks, getAllPlatforms } = require('../controllers/streamingController');

router.get('/links', getStreamingLinks);
router.get('/platforms', getAllPlatforms);

module.exports = router;
