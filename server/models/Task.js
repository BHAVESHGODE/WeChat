const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  category: { type: String, enum: ['assignment', 'exam', 'project', 'other'], default: 'other' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  estimatedTime: { type: Number, default: 0 },
  deadline: { type: Date, default: null },
  reminderTime: { type: Date, default: null },
  notifications: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  userId: { type: String, required: true },
  googleEventId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);
