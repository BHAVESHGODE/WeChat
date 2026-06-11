const express = require('express');
const router = express.Router();
const { getPlaylists, getPlaylistById, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist } = require('../controllers/playlistController');

router.get('/', getPlaylists);
router.get('/:id', getPlaylistById);
router.post('/', createPlaylist);
router.post('/:id/tracks', addTrackToPlaylist);
router.delete('/:id/tracks/:trackId', removeTrackFromPlaylist);

module.exports = router;
