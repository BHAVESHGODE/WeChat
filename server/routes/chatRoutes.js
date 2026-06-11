const express = require('express');
const router = express.Router();
const {
  listDiscussions,
  listIssues,
  getThreadMessages,
  addReply,
  createGist,
  graphQLQuery,
  getLocalThreads,
  getLocalMessages,
  toggleFavorite,
  togglePin,
  aiChat,
  aiChatDirect,
  nvidiaTasks,
} = require('../controllers/chatController');

router.get('/discussions', listDiscussions);
router.get('/issues', listIssues);
router.get('/messages', getThreadMessages);
router.post('/reply', addReply);
router.post('/gist', createGist);
router.post('/graphql', graphQLQuery);
router.get('/threads', getLocalThreads);
router.get('/threads/messages', getLocalMessages);
router.post('/favorite', toggleFavorite);
router.post('/pin', togglePin);
router.post('/ai', aiChat);
router.post('/ai/direct', aiChatDirect);
router.post('/nvidia', nvidiaTasks);

module.exports = router;
