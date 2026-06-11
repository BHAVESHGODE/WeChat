const Progress = require('../models/Progress');

async function upsertProgress(req, res) {
  try {
    const { userId, itemType, itemId, source, title, imageUrl, genres, score, totalItems, currentItem, status, notes } = req.body;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }

    const filter = { userId, itemType, itemId };
    const update = {
      ...(source && { source }),
      ...(title && { title }),
      ...(imageUrl && { imageUrl }),
      ...(genres && { genres }),
      ...(score !== undefined && { score }),
      ...(totalItems !== undefined && { totalItems }),
      ...(currentItem !== undefined && { currentItem }),
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
    };

    if (status === 'completed' || (totalItems && currentItem >= totalItems)) {
      update.completedAt = new Date();
      update.status = 'completed';
    }

    const entry = await Progress.findOneAndUpdate(filter, update, { upsert: true, new: true });
    res.json({ data: entry });
  } catch (err) {
    console.error('Progress upsert error:', err.message);
    if (err.code === 11000) return res.status(409).json({ error: 'Duplicate entry' });
    res.status(500).json({ error: 'Failed to save progress' });
  }
}

async function getProgress(req, res) {
  try {
    const { userId, itemType, status, limit = 50 } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const filter = { userId };
    if (itemType) filter.itemType = itemType;
    if (status) filter.status = status;

    const entries = await Progress.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(parseInt(limit), 100));

    res.json({ data: entries });
  } catch (err) {
    console.error('Progress get error:', err.message);
    res.status(500).json({ error: 'Failed to get progress' });
  }
}

async function getSingleProgress(req, res) {
  try {
    const { userId, itemType, itemId } = req.query;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }
    const entry = await Progress.findOne({ userId, itemType, itemId });
    res.json({ data: entry });
  } catch (err) {
    console.error('Progress single get error:', err.message);
    res.status(500).json({ error: 'Failed to get progress' });
  }
}

async function deleteProgress(req, res) {
  try {
    const { userId, itemType, itemId } = req.query;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }
    const entry = await Progress.findOneAndDelete({ userId, itemType, itemId });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Progress entry removed' });
  } catch (err) {
    console.error('Progress delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete progress' });
  }
}

async function batchUpdateProgress(req, res) {
  try {
    const { userId, items } = req.body;
    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'userId and items array are required' });
    }

    const results = [];
    for (const item of items) {
      const { itemType, itemId, currentItem, status } = item;
      if (!itemType || !itemId) continue;

      const entry = await Progress.findOneAndUpdate(
        { userId, itemType, itemId },
        { ...(currentItem !== undefined && { currentItem }), ...(status && { status }), updatedAt: new Date() },
        { new: true }
      );
      if (entry) results.push(entry);
    }

    res.json({ data: results, count: results.length });
  } catch (err) {
    console.error('Batch update error:', err.message);
    res.status(500).json({ error: 'Failed to batch update' });
  }
}

module.exports = {
  upsertProgress,
  getProgress,
  getSingleProgress,
  deleteProgress,
  batchUpdateProgress,
};
