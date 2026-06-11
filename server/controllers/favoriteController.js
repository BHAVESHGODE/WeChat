const Favorite = require('../models/Favorite');

const addFavorite = async (req, res) => {
  try {
    const { userId, itemType, itemId, title, imageUrl, score, type, genres } = req.body;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, and itemId are required' });
    }

    const existing = await Favorite.findOne({ userId, itemType, itemId });
    if (existing) {
      return res.status(409).json({ error: 'Already in favorites', favorite: existing });
    }

    const favorite = await Favorite.create({ userId, itemType, itemId, title, imageUrl, score, type, genres });
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { userId, itemType, itemId } = req.body;
    const deleted = await Favorite.findOneAndDelete({ userId, itemType, itemId });
    if (!deleted) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    res.json({ message: 'Removed from favorites', favorite: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemType } = req.query;
    const filter = { userId };
    if (itemType) filter.itemType = itemType;
    const favorites = await Favorite.find(filter).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { userId, itemType, itemId } = req.query;
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType, itemId required' });
    }
    const favorite = await Favorite.findOne({ userId, itemType, itemId });
    res.json({ isFavorite: !!favorite, favorite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addFavorite, removeFavorite, getFavorites, checkFavorite };
