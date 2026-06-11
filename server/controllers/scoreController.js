const Score = require('../models/Score');

const getScores = async (req, res) => {
  try {
    const { userId } = req.params;
    const scores = await Score.find({ userId }).sort({ playedAt: -1 }).limit(50);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { game } = req.params;
    const scores = await Score.find({ game }).sort({ score: -1 }).limit(10);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveScore = async (req, res) => {
  try {
    const { userId, game, score } = req.body;
    if (!userId || !game || score === undefined) {
      return res.status(400).json({ message: 'userId, game, and score are required' });
    }
    const saved = await Score.create({ userId, game, score });
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteScore = async (req, res) => {
  try {
    const { id } = req.params;
    await Score.findByIdAndDelete(id);
    res.json({ message: 'Score deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const scores = await Score.find({ userId });
    const totalGames = scores.length;
    const gamesPlayed = [...new Set(scores.map((s) => s.game))];
    const bestScores = {};
    const recentScores = scores.slice(0, 5);
    const gameCounts = {};
    scores.forEach((s) => {
      gameCounts[s.game] = (gameCounts[s.game] || 0) + 1;
      if (!bestScores[s.game] || s.score > bestScores[s.game]) {
        bestScores[s.game] = s.score;
      }
    });
    const mostPlayed = Object.entries(gameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([game, count]) => ({ game, count }));
    res.json({ totalGames, uniqueGames: gamesPlayed.length, bestScores, mostPlayed, recentScores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetScores = async (req, res) => {
  try {
    const { userId } = req.body;
    await Score.deleteMany({ userId });
    res.json({ message: 'All scores reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getScores, getLeaderboard, saveScore, deleteScore, getStats, resetScores };
