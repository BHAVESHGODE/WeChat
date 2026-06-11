const WatchList = require('../models/WatchList');

async function addToWatchList(req, res) {
  try {
    const { userId, itemType, itemId, title, imageUrl, score, type, genres, status, total } = req.body;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }
    const existing = await WatchList.findOne({ userId, itemType, itemId });
    if (existing) {
      existing.status = status || existing.status;
      existing.updatedAt = Date.now();
      if (total) existing.total = total;
      await existing.save();
      return res.json({ data: existing, message: 'Watch list entry updated' });
    }
    const entry = await WatchList.create({
      userId, itemType, itemId, title, imageUrl, score, type, genres,
      status: status || 'watching',
      progress: 0,
      total,
    });
    res.status(201).json({ data: entry, message: 'Added to watch list' });
  } catch (err) {
    console.error('WatchList add error:', err.message);
    if (err.code === 11000) return res.status(409).json({ error: 'Already in watch list' });
    res.status(500).json({ error: 'Failed to add to watch list' });
  }
}

async function updateWatchListEntry(req, res) {
  try {
    const { userId, itemType, itemId } = req.query;
    const updates = req.body;
    const entry = await WatchList.findOneAndUpdate(
      { userId, itemType, itemId },
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Watch list entry not found' });
    res.json({ data: entry });
  } catch (err) {
    console.error('WatchList update error:', err.message);
    res.status(500).json({ error: 'Failed to update watch list entry' });
  }
}

async function removeFromWatchList(req, res) {
  try {
    const { userId, itemType, itemId } = req.query;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }
    const entry = await WatchList.findOneAndDelete({ userId, itemType, itemId: parseInt(itemId) });
    if (!entry) return res.status(404).json({ error: 'Watch list entry not found' });
    res.json({ message: 'Removed from watch list' });
  } catch (err) {
    console.error('WatchList remove error:', err.message);
    res.status(500).json({ error: 'Failed to remove from watch list' });
  }
}

async function getWatchList(req, res) {
  try {
    const { userId, itemType, status } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const filter = { userId };
    if (itemType) filter.itemType = itemType;
    if (status) filter.status = status;

    const entries = await WatchList.find(filter).sort({ updatedAt: -1 });
    res.json({ data: entries });
  } catch (err) {
    console.error('WatchList get error:', err.message);
    res.status(500).json({ error: 'Failed to get watch list' });
  }
}

async function checkWatchList(req, res) {
  try {
    const { userId, itemType, itemId } = req.query;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }
    const entry = await WatchList.findOne({ userId, itemType, itemId });
    res.json({ inList: !!entry, data: entry || null });
  } catch (err) {
    console.error('WatchList check error:', err.message);
    res.status(500).json({ error: 'Failed to check watch list' });
  }
}

module.exports = {
  addToWatchList,
  updateWatchListEntry,
  removeFromWatchList,
  getWatchList,
  checkWatchList,
};
