const express = require('express');
const router = express.Router();
const User = require('../models/User');

const cardDesigns = [
  { id: 'festive', label: 'Festive', emoji: '🎊', bg: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77)' },
  { id: 'elegant', label: 'Elegant', emoji: '✨', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 'playful', label: 'Playful', emoji: '🎈', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
];

const birthdayQuotes = [
  'Another year, another adventure. Make it unforgettable!',
  'You are not getting older, you are leveling up!',
  'Celebrate today like the legend you are becoming.',
  'The best is yet to come. Happy birthday, superstar!',
  'May your day be filled with joy, laughter, and cake!',
];

router.get('/check/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const user = await User.findOne({ name: formattedName });

    if (!user || !user.birthday) {
      return res.json({ isBirthday: false });
    }

    const today = new Date();
    const bday = new Date(user.birthday);
    const isBirthday = today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth();

    if (!isBirthday) {
      return res.json({ isBirthday: false });
    }

    res.json({
      isBirthday: true,
      user: { name: user.name, role: user.role },
      message: `Happy Birthday, ${user.name}! 🎂🎉`,
      quote: birthdayQuotes[Math.floor(Math.random() * birthdayQuotes.length)],
      cardDesigns,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
