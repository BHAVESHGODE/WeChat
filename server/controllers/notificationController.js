const Task = require('../models/Task');

const quotes = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Small progress is still progress.', author: 'Unknown' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Your only limit is your mind.', author: 'Unknown' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
];

const dailyQuote = (req, res) => {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  res.json(q);
};

const getUpcomingReminders = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const tasks = await Task.find({
      userId,
      status: 'pending',
      notifications: true,
      deadline: { $ne: null, $gte: now },
    }).sort({ deadline: 1 }).limit(5);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { dailyQuote, getUpcomingReminders };
