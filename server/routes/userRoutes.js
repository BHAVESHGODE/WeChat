const express = require('express');
const router = express.Router();
const { getUserByName } = require('../controllers/userController');

// Route: GET /api/:name (e.g., /api/maverick, /api/bell, /api/goju)
router.get('/:name', getUserByName);

module.exports = router;
