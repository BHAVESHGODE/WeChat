const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  studyMinutes: { type: Number, default: 0 },
  sessions: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
});

streakSchema.index({ userId: 1, date: -1 });
streakSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Streak', streakSchema);
