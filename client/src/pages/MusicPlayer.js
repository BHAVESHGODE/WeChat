import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useMusic } from '../context/MusicContext';
import MusicSidebar from '../components/MusicSidebar';
import DiscoverSection from '../components/DiscoverSection';
import LyricsPanel from '../components/LyricsPanel';
import PlaylistSelector from '../components/PlaylistSelector';
import AdFreeYouTube from '../components/AdFreeYouTube';
import AmbientSounds from '../components/AmbientSounds';
import PlayerControls from '../components/PlayerControls';
import NowPlayingModal from '../components/NowPlayingModal';

const API = process.env.REACT_APP_API_URL;

const POPULAR_ARTISTS = [
  { name: 'Pritam', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/300x300bb.jpg' },
  { name: 'A.R. Rahman', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/56/ac/41/56ac41f7-99f3-3eae-3b07-443167292c4e/8902894697408_cover.jpg/300x300bb.jpg' },
  { name: 'Arijit Singh', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/300x300bb.jpg' },
  { name: 'Sachin-Jigar', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/2e/0b/c0/2e0bc070-112f-a827-6ad8-6bc64f7caaff/840214460180.png/300x300bb.jpg' },
  { name: 'Vishal-Shekhar', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f4/0b/88/f40b88d5-75cb-27b8-6b00-bba98f0f2fd0/849486006911_cover.jpg/300x300bb.jpg' },
  { name: 'Atif Aslam', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/35/85/12/358512ee-128b-977f-40bc-669beb1bcc8d/196871079747.jpg/300x300bb.jpg' }
];

const POPULAR_ALBUMS = [
  { title: 'Aashiqui 2', artist: 'Mithoon, Ankit Tiwari, Jeet Gannguli', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/300x300bb.jpg' },
  { title: 'Yeh Jawaani Hai Deewani', artist: 'Pritam', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/62/d6/74/62d67432-0670-631f-db6a-d4bac3adae4b/8902894353328_cover.jpg/300x300bb.jpg' },
  { title: 'Sanam Teri Kasam', artist: 'Himesh Reshammiya, Sameer Anjaan, Subrat...', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4b/7a/63/4b7a63a9-9a50-5be4-30b2-487f920a576f/196872880069.jpg/300x300bb.jpg' },
  { title: 'Finding Her', artist: 'Kushagra, Bharath, Saaheal', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0e/4f/58/0e4f5828-64f8-26d5-ebde-661b6fee89fe/5034644353067.jpg/300x300bb.jpg' },
  { title: 'Young G.O.A.T', artist: 'Cheema Y, Gur Sidhu', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/13/8d/d9/138dd9a3-428a-9fe8-06d6-58b203b4fe46/artwork.jpg/300x300bb.jpg' },
  { title: 'Raanjhan (From "Do Patti")', artist: 'Sachet-Parampara, Parampara Tandon, Kausar...', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/99/a9/ca/99a9caf7-5d9f-5890-3fdf-e3ff8c860e79/8903431018915_cover.jpg/300x300bb.jpg' }
];

function MusicPlayer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = searchParams.get('user') || 'Maverick';

  const {
    currentPlaylist, currentTrack, isPlaying, playlists,
    play, pause, resume, selectPlaylist, queue, queueIndex,
    showLyrics, lyrics, setShowLyrics,
    addToQueue, playFromQueue, removeFromQueue,
    refreshPlaylists, autoplayVibe,
  } = useMusic();

  const [gaanaUrl, setGaanaUrl] = useState('');
  const [loadingGaana, setLoadingGaana] = useState(false);
  const [gaanaSong, setGaanaSong] = useState(null);
  const [gaanaError, setGaanaError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
const [sidebarOpen, setSidebarOpen] = useState(false);
const [showNowPlaying, setShowNowPlaying] = useState(false);
const [trending, setTrending] = useState([]);
const [trendingLoading, setTrendingLoading] = useState(true);

const location = useLocation();

useEffect(() => {
  const fetchTrending = async () => {
    try {
      const res = await fetch(`${API}/api/music/trending?country=india&limit=15`);
      const data = await res.json();
      if (data.tracks) setTrending(data.tracks);
    } catch {}
    setTrendingLoading(false);
  };
  if (!location.pathname.includes('adyoutube')) fetchTrending();
}, [location.pathname]);
  const sectionsRef = {
    home: useRef(null),
    playlists: useRef(null),
    discover: useRef(null),
    ambient: useRef(null),
  };

  useEffect(() => {
    const tab =
      location.pathname === '/music' ? 'home'
      : location.pathname.includes('playlists') ? 'playlists'
      : location.pathname.includes('discover') ? 'discover'
      : location.pathname.includes('ambient') ? 'ambient'
      : 'home';
    const el = sectionsRef[tab]?.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.pathname]);

  useEffect(() => {
    if (playlists.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(playlists[0]._id);
    }
  }, [playlists, selectedPlaylistId]);

  const handleFetchGaana = async () => {
    if (!gaanaUrl.trim() || !gaanaUrl.includes('gaana.com')) {
      setGaanaError('Please enter a valid Gaana.com URL');
      return;
    }
    setLoadingGaana(true);
    setGaanaError('');
    setGaanaSong(null);
    try {
      const res = await fetch(`${API}/api/gaana?url=${encodeURIComponent(gaanaUrl.trim())}&lyrics=true`);
      const data = await res.json();
      if (data.error) setGaanaError(data.error);
      else setGaanaSong(data);
    } catch {
      setGaanaError('Failed to fetch song details.');
    }
    setLoadingGaana(false);
  };

  const handlePlayGaana = () => {
    if (!gaanaSong) return;
    const track = {
      title: gaanaSong.title, artist: gaanaSong.artist,
      duration: gaanaSong.duration, source: 'gaana',
      thumbnail: gaanaSong.thumbnail, album: gaanaSong.album,
      playableLink: gaanaSong.playable_link,
      sourceUrl: gaanaSong.source_url,
      videoId: '', lyrics: gaanaSong.lyrics || '',
    };
    play(track, -1, [track]);
  };

  const handleSaveToPlaylist = async () => {
    if (!gaanaSong || !selectedPlaylistId) return;
    setSaving(true); setSaveMsg('');
    try {
      const track = {
        title: gaanaSong.title, artist: gaanaSong.artist,
        duration: gaanaSong.duration, source: 'gaana',
        thumbnail: gaanaSong.thumbnail, album: gaanaSong.album,
        playableLink: gaanaSong.playable_link,
        sourceUrl: gaanaSong.source_url,
        lyrics: gaanaSong.lyrics || '', videoId: '',
      };
      const res = await fetch(`${API}/api/playlists/${selectedPlaylistId}/tracks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track),
      });
      if (res.ok) {
        setSaveMsg('Saved to playlist!');
        const refreshed = await refreshPlaylists();
        const pl = refreshed.find((p) => p._id === selectedPlaylistId);
        if (pl) selectPlaylist(pl);
      } else setSaveMsg('Failed to save.');
    } catch { setSaveMsg('Failed to save.'); }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const res = await fetch(`${API}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim(), createdBy: user }),
      });
      if (res.ok) {
        await refreshPlaylists();
        setNewPlaylistName('');
        setShowNewPlaylistModal(false);
      }
    } catch {}
  };

  const handlePlayArtist = async (artistName) => {
    try {
      const res = await fetch(`${API}/api/music/artist-top?artist=${encodeURIComponent(artistName)}&limit=15`);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        play(data.tracks[0], 0, data.tracks);
      }
    } catch (err) {
      console.error("Failed to play artist tracks:", err);
    }
  };

  const handlePlayAlbum = async (albumTitle) => {
    try {
      const res = await fetch(`${API}/api/music/search?q=${encodeURIComponent(albumTitle)}&limit=15`);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        play(data.tracks[0], 0, data.tracks);
      }
    } catch (err) {
      console.error("Failed to play album tracks:", err);
    }
  };

  const handlePlayFromDiscover = (track, tracks = []) => {
    const finalTracks = autoplayVibe ? [track] : tracks;
    const idx = finalTracks.findIndex((t) => t.trackId === track.trackId || t.previewUrl === track.previewUrl);
    play(track, idx >= 0 ? idx : 0, finalTracks.length > 0 ? finalTracks : [track]);
  };

  const handleTrackClick = (track, idx, tracks) => {
    const isSameTrack = currentTrack && (
      (currentTrack._id && track._id && currentTrack._id === track._id) ||
      (currentTrack.videoId && track.videoId && currentTrack.videoId === track.videoId) ||
      (currentTrack.title === track.title && currentTrack.artist === track.artist)
    );
    if (isSameTrack && isPlaying) { pause(); return; }
    if (isSameTrack) { resume(); return; }
    play(track, idx, tracks);
  };

  const fmtDuration = (s) => {
    if (!s) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <div className="music-layout">
      <MusicSidebar
        user={user}
        onNewPlaylist={() => setShowNewPlaylistModal(true)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      <div className="music-main">
        <header className="music-header" role="banner">
          <button
            className="music-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <span className={`music-hamburger-line ${sidebarOpen ? 'open' : ''}`} />
            <span className={`music-hamburger-line ${sidebarOpen ? 'open' : ''}`} />
            <span className={`music-hamburger-line ${sidebarOpen ? 'open' : ''}`} />
          </button>
          <h1 className="music-header-title">
            {location.pathname.includes('adyoutube') ? 'Ad-Free YouTube'
              : location.pathname.includes('discover') ? 'Search'
              : location.pathname.includes('ambient') ? 'Ambient'
              : location.pathname.includes('playlists') ? 'Playlists'
              : 'Music'}
          </h1>
          {currentTrack && (
            <button
              className="music-header-nowplaying-btn"
              onClick={() => setShowNowPlaying(true)}
              aria-label="Now playing"
            >
              <img src={currentTrack.thumbnail} alt="" className="music-header-thumb" />
            </button>
          )}
        </header>

        <div className="music-main-scroll">
          {location.pathname.includes('adyoutube') ? (
            <AdFreeYouTube />
          ) : (
            <>
              {/* Conditional Routing Sections */}
              {location.pathname.includes('discover') ? (
                <div ref={sectionsRef.discover} className="music-section">
                  <DiscoverSection
                    onPlay={handlePlayFromDiscover}
                    playlists={playlists}
                    onSaveToPlaylist={async (track, playlistId) => {
                      const res = await fetch(`${API}/api/playlists/${playlistId}/tracks`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(track),
                      });
                      if (res.ok) {
                        const refreshed = await refreshPlaylists();
                        return true;
                      }
                      return false;
                    }}
                    onAddToQueue={addToQueue}
                    onNewPlaylist={() => setShowNewPlaylistModal(true)}
                  />
                </div>
              ) : location.pathname.includes('playlists') ? (
                <div ref={sectionsRef.playlists}>
                  <PlaylistSelector />

                  {/* Current Playlist Tracks */}
                  {currentPlaylist && (
                    <div className="music-section">
                      <h2 className="music-section-title">{currentPlaylist.name} — Tracks</h2>
                      <div className="track-list">
                        {currentPlaylist.tracks.map((track, idx) => {
                          const isActiveTrack = currentTrack?._id === track._id || (currentTrack?.title === track.title && currentTrack?.artist === track.artist);
                          return (
                            <div
                              key={track._id || track.videoId || idx}
                              className={`track-item ${isActiveTrack ? 'active' : ''}`}
                              onClick={() => handleTrackClick(track, idx, currentPlaylist.tracks)}
                            >
                              <span className="track-idx">
                                {isActiveTrack && isPlaying ? (
                                  <span className="track-equalizer" aria-label="Now playing">
                                    <span /><span /><span />
                                  </span>
                                ) : (
                                  idx + 1
                                )}
                              </span>
                              {(track.thumbnail || track.image_url) && (
                                <img src={track.thumbnail || track.image_url} alt="" className="track-thumb" />
                              )}
                              <div className="track-info">
                                <span className="track-title">{track.title}</span>
                                <span className="track-artist">{track.artist}</span>
                              </div>
                              <span className="track-duration">{fmtDuration(track.duration)}</span>
                              <button className="track-queue-btn" onClick={(e) => { e.stopPropagation(); addToQueue(track); }} title="Add to Queue">+Q</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Queue */}
                  {queue.length > 0 && (
                    <div className="music-section">
                      <h2 className="music-section-title">Up Next ({queue.length})</h2>
                      <div className="track-list">
                        {queue.map((track, idx) => (
                          <div
                            key={idx}
                            className={`track-item ${queueIndex === idx ? 'active' : ''}`}
                            onClick={() => playFromQueue(idx, queue)}
                          >
                            <span className="track-idx">{idx + 1}</span>
                            {track.thumbnail && <img src={track.thumbnail} alt="" className="track-thumb" />}
                            <div className="track-info">
                              <span className="track-title">{track.title}</span>
                              <span className="track-artist">{track.artist}</span>
                            </div>
                            <button className="track-remove-btn" onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gaana Fetcher */}
                  <div className="music-section gaana-section">
                    <h2 className="music-section-title">Fetch from Gaana</h2>
                    <div className="gaana-input-row">
                      <input
                        className="gaana-input"
                        type="text"
                        placeholder="Paste Gaana.com song link..."
                        value={gaanaUrl}
                        onChange={(e) => setGaanaUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchGaana()}
                      />
                      <button className="gaana-fetch-btn" onClick={handleFetchGaana} disabled={loadingGaana}>
                        {loadingGaana ? 'Fetching...' : 'Fetch'}
                      </button>
                    </div>
                    {gaanaError && <p className="gaana-error">{gaanaError}</p>}
                    {gaanaSong && (
                      <div className="gaana-song-card">
                        {gaanaSong.thumbnail && (
                          <img src={gaanaSong.thumbnail} alt={gaanaSong.title} className="gaana-art" />
                        )}
                        <div className="gaana-details">
                          <h3 className="gaana-title">{gaanaSong.title}</h3>
                          <p className="gaana-artist">{gaanaSong.artist}</p>
                          {gaanaSong.album && <p className="gaana-album">Album: {gaanaSong.album}</p>}
                          <p className="gaana-meta">{fmtDuration(gaanaSong.duration)}</p>
                          <div className="gaana-actions">
                            <button className="gaana-play-btn" onClick={handlePlayGaana}>▶ Play</button>
                            <label className="toggle-label">
                              <input type="checkbox" checked={showLyrics} onChange={() => setShowLyrics(!showLyrics)} />
                              <span className="toggle-track"><span className="toggle-thumb" /></span>
                              <span className="toggle-text">Lyrics</span>
                            </label>
                          </div>
                          {showLyrics && gaanaSong.lyrics && <pre className="gaana-lyrics">{gaanaSong.lyrics}</pre>}
                          <div className="gaana-save-section">
                            <select className="gaana-playlist-select" value={selectedPlaylistId} onChange={(e) => setSelectedPlaylistId(e.target.value)}>
                              {playlists.map((pl) => <option key={pl._id} value={pl._id}>{pl.name}</option>)}
                            </select>
                            <button className="gaana-save-btn" onClick={handleSaveToPlaylist} disabled={saving || !selectedPlaylistId}>
                              {saving ? 'Saving...' : 'Save to Playlist'}
                            </button>
                            {saveMsg && <p className="gaana-save-msg">{saveMsg}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : location.pathname.includes('ambient') ? (
                <div ref={sectionsRef.ambient} className="music-section">
                  <AmbientSounds />
                </div>
              ) : (
                <div ref={sectionsRef.home}>
                  <div className="music-hero">
                    <h1 className="music-hero-title">🎵 Music</h1>
                    <p className="music-hero-subtitle">Discover, play, and enjoy — ad-free, {user}!</p>
                  </div>

                  {/* Popular Artists */}
                  <div className="spotify-home-section">
                    <div className="spotify-home-header">
                      <h2>Popular artists</h2>
                      <button className="spotify-home-showall" onClick={() => navigate(`/music/discover?user=${user}`)}>Show all</button>
                    </div>
                    <div className="spotify-home-grid">
                      {POPULAR_ARTISTS.map((artist) => (
                        <div key={artist.name} className="artist-card" onClick={() => handlePlayArtist(artist.name)}>
                          <img src={artist.img} alt={artist.name} className="artist-card-img" />
                          <p className="artist-card-name">{artist.name}</p>
                          <p className="artist-card-type">Artist</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Albums */}
                  <div className="spotify-home-section">
                    <div className="spotify-home-header">
                      <h2>Popular albums and singles</h2>
                      <button className="spotify-home-showall" onClick={() => navigate(`/music/discover?user=${user}`)}>Show all</button>
                    </div>
                    <div className="spotify-home-grid">
                      {POPULAR_ALBUMS.map((album) => (
                        <div key={album.title} className="album-card" onClick={() => handlePlayAlbum(album.title)}>
                          <img src={album.img} alt={album.title} className="album-card-img" />
                          <p className="album-card-title">{album.title}</p>
                          <p className="album-card-artists">{album.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lyrics Panel (rendered at the bottom of active section) */}
              {showLyrics && lyrics && (
                <div className="music-section">
                  <LyricsPanel
                    lyrics={lyrics}
                    title={currentTrack?.title}
                    artist={currentTrack?.artist}
                    onClose={() => setShowLyrics(false)}
                  />
                </div>
              )}

              {/* New Playlist Modal */}
              {showNewPlaylistModal && (
                <div className="modal-overlay" onClick={() => setShowNewPlaylistModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>New Playlist</h3>
                    <input
                      className="modal-input"
                      type="text"
                      placeholder="Playlist name..."
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                      autoFocus
                    />
                    <div className="modal-actions">
                      <button className="modal-btn modal-btn-primary" onClick={handleCreatePlaylist}>Create</button>
                      <button className="modal-btn" onClick={() => setShowNewPlaylistModal(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>

      <PlayerControls onOpenNowPlaying={() => setShowNowPlaying(true)} />
      {showNowPlaying && <NowPlayingModal onClose={() => setShowNowPlaying(false)} />}
    </div>
  );
}

export default MusicPlayer;
