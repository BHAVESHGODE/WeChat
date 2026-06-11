const Streak = require('../models/Streak');

const BADGES = [
  { id: 'first_study', name: 'First Study', icon: '🌱', minDays: 1 },
  { id: 'week_streak', name: 'Week Warrior', icon: '🔥', minDays: 7 },
  { id: 'month_streak', name: 'Monthly Master', icon: '⭐', minDays: 30 },
  { id: 'two_month', name: 'Dedicated Scholar', icon: '🏆', minDays: 60 },
  { id: 'quarter', name: 'Quarter Champion', icon: '👑', minDays: 90 },
  { id: 'half_year', name: 'Half-Year Hero', icon: '💎', minDays: 180 },
];

const logSession = async (req, res) => {
  try {
    const { userId, minutes } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await Streak.findOne({ userId, date: today });
    if (existing) {
      existing.studyMinutes += minutes;
      existing.sessions += 1;
      await existing.save();
      res.json(existing);
    } else {
      const streak = await Streak.create({ userId, date: today, studyMinutes: minutes, sessions: 1 });
      res.status(201).json(streak);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStreaks = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await Streak.find({ userId }).sort({ date: -1 }).limit(90);
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].date + 'T00:00:00');
      const diff = Math.round((today - logDate) / 86400000);
      if (diff === i) currentStreak++;
      else break;
    }
    const totalMinutes = logs.reduce((sum, l) => sum + l.studyMinutes, 0);
    const totalSessions = logs.reduce((sum, l) => sum + l.sessions, 0);
    const activeDays = logs.filter((l) => l.studyMinutes > 0).length;
    const badges = BADGES.filter((b) => currentStreak >= b.minDays).map((b) => b.id);
    res.json({ currentStreak, totalMinutes, totalSessions, activeDays, today: logs[0] || null, badges, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const recordTaskComplete = async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await Streak.findOne({ userId, date: today });
    if (existing) {
      existing.tasksCompleted += 1;
      await existing.save();
      res.json(existing);
    } else {
      const streak = await Streak.create({ userId, date: today, tasksCompleted: 1 });
      res.status(201).json(streak);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await Streak.find({ userId }).sort({ date: -1 }).limit(90);
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].date + 'T00:00:00');
      const diff = Math.round((today - logDate) / 86400000);
      if (diff === i) currentStreak++;
      else break;
    }
    const earned = BADGES.filter((b) => currentStreak >= b.minDays).map((b) => ({
      ...b,
      earned: true,
      progress: Math.min(100, Math.round((currentStreak / b.minDays) * 100)),
    }));
    const locked = BADGES.filter((b) => currentStreak < b.minDays).map((b) => ({
      ...b,
      earned: false,
      progress: Math.min(100, Math.round((currentStreak / b.minDays) * 100)),
    }));
    res.json({ currentStreak, badges: [...earned, ...locked] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { logSession, getStreaks, recordTaskComplete, getBadges };
