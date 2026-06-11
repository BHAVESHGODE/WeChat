const Playlist = require('../models/Playlist');

const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find().sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.create(req.body);
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addTrackToPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const track = req.body;
    const playlist = await Playlist.findById(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    playlist.tracks.push(track);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeTrackFromPlaylist = async (req, res) => {
  try {
    const { id, trackId } = req.params;
    const playlist = await Playlist.findById(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    playlist.tracks = playlist.tracks.filter((t) => t._id.toString() !== trackId);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPlaylists, getPlaylistById, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist };
