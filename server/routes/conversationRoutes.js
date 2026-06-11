const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  clearConversation,
} = require('../controllers/conversationController');

router.post('/:userId', sendMessage);
router.get('/:userId', getConversation);
router.delete('/:userId', clearConversation);

module.exports = router;
