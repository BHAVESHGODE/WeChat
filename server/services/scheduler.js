const cron = require('node-cron');
const Task = require('../models/Task');

const notifiedTasks = new Set();

function startScheduler(io) {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const tasks = await Task.find({
        status: 'pending',
        notifications: true,
        reminderTime: { $ne: null, $lte: now },
      });

      for (const task of tasks) {
        const key = task._id.toString();
        if (notifiedTasks.has(key)) continue;
        notifiedTasks.add(key);

        const message = {
          type: 'task_reminder',
          userId: task.userId,
          title: task.title,
          text: `Reminder: "${task.title}" is due soon!`,
        };

        if (io) {
          io.to(`user:${task.userId}`).emit('notification', message);
          io.emit('notification', message);
        }

        console.log(`[Scheduler] Reminder for ${task.userId}: ${task.title}`);
      }
    } catch (err) {
      console.error('[Scheduler] Error:', err.message);
    }
  });

  console.log('[Scheduler] Task reminder cron started (every minute)');
}

module.exports = { startScheduler };
