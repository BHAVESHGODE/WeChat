const Conversation = require('../models/Conversation');
const SafeSpace = require('../models/SafeSpace');
const { getAIResponse, getSafeSpaceResponse } = require('../services/aiService');

// Send a message and get AI response
const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text, safeSpace } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (safeSpace) {
      let safeConv = await SafeSpace.findOne({ userId });
      if (!safeConv) {
        safeConv = new SafeSpace({ userId, messages: [] });
      }

      const userMessage = { sender: 'user', text: text.trim(), timestamp: new Date() };
      safeConv.messages.push(userMessage);

      const aiHistory = safeConv.messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const { text: aiText, provider } = await getSafeSpaceResponse(aiHistory);
      const aiMessage = { sender: 'ai', text: aiText, provider, timestamp: new Date() };
      safeConv.messages.push(aiMessage);

      await safeConv.save();

      return res.json({ userMessage, aiMessage, safeSpace: true });
    }

    let conversation = await Conversation.findOne({ userId });

    if (!conversation) {
      conversation = new Conversation({ userId, messages: [] });
    }

    const userMessage = { sender: 'user', text: text.trim(), timestamp: new Date() };
    conversation.messages.push(userMessage);

    const aiHistory = conversation.messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const { text: aiText, provider } = await getAIResponse(aiHistory);
    const aiMessage = { sender: 'ai', text: aiText, provider, timestamp: new Date() };
    conversation.messages.push(aiMessage);

    await conversation.save();

    res.json({ userMessage, aiMessage });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    res.status(500).json({ error: 'AI service failed' });
  }
};

// Get conversation history for a user
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const [conversation, safeConv] = await Promise.all([
      Conversation.findOne({ userId }),
      SafeSpace.findOne({ userId }),
    ]);

    const regular = conversation?.messages || [];
    const safe = safeConv?.messages || [];
    const all = [...regular, ...safe].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ messages: all });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear conversation history
const clearConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    await Promise.all([
      Conversation.findOneAndDelete({ userId }),
      SafeSpace.findOneAndDelete({ userId }),
    ]);
    res.json({ message: 'Conversation cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getConversation, clearConversation };
