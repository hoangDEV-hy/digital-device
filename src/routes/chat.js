const express = require('express');
const auth = require('../middlewares/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.use(auth.required);
router.get('/contacts', chatController.listContacts);
router.get('/conversations', chatController.listConversations);
router.post('/conversations', chatController.startConversation);
router.get('/conversations/:conversationId/messages', chatController.listMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markRead);

module.exports = router;