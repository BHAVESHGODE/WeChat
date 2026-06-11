import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

const MusicContext = createContext();
const API = process.env.REACT_APP_API_URL;

function MusicProvider({ children }) {
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [progress, setProgress] = useState({ elapsed: 0, duration: 0 });
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [volume, setVolumeState] = useState(80);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [playerReady, setPlayerReady] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [autoplayVibe, setAutoplayVibe] = useState(true);

  const recommendedTracksRef = useRef([]);
  const autoplayVibeRef = useRef(true);
  useEffect(() => { recommendedTracksRef.current = recommendedTracks; }, [recommendedTracks]);
  useEffect(() => { autoplayVibeRef.current = autoplayVibe; }, [autoplayVibe]);

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const trackListRef = useRef([]);
  const trackIndexRef = useRef(-1);
  const isPlayingRef = useRef(false);
  const queueRef = useRef([]);
  const queueIndexRef = useRef(-1);
  const shuffleRef = useRef(false);
  const repeatRef = useRef('off');
  const shuffleOrderRef = useRef([]);
  const originalOrderRef = useRef([]);

  useEffect(() => { trackIndexRef.current = currentTrackIndex; }, [currentTrackIndex]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  useEffect(() => {
    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => setApiReady(true);
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    } else {
      setApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (!apiReady || playerRef.current) return;
    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '0', width: '0',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1 },
      events: {
        onReady: () => setPlayerReady(true),
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          else if (event.data === window.YT.PlayerState.ENDED) handleTrackEnd();
        },
      },
    });
  }, [apiReady]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        try {
          if (videoRef.current && videoRef.current.src) {
            setProgress({
              elapsed: videoRef.current.currentTime || 0,
              duration: videoRef.current.duration || 0,
            });
          } else if (playerRef.current?.getCurrentTime) {
            setProgress({
              elapsed: playerRef.current.getCurrentTime(),
              duration: playerRef.current.getDuration(),
            });
          }
        } catch (e) { }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    fetch(API + '/api/playlists')
      .then((r) => r.json())
      .then((data) => setPlaylists(data))
      .catch((e) => console.error('Playlists fetch failed:', e));
  }, []);

  const stopHls = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ''; }
  }, []);

  const playHls = useCallback((url) => {
    stopHls();
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else stopHls();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
    }
  }, [stopHls]);

  const loadPreviewFallback = useCallback((track) => {
    if (track.previewUrl) {
      stopHls();
      const video = videoRef.current;
      if (video) {
        video.src = track.previewUrl;
        video.play().catch(() => {});
      }
    }
  }, [stopHls]);

  const loadTrack = useCallback((track) => {
    if (!track) return;

    if (!track.videoId && !track.playableLink && track.source !== 'gaana' && track.source !== 'adyoutube') {
      fetch(`${API}/api/music/youtube?q=${encodeURIComponent(track.title + ' ' + track.artist)}&limit=1`)
        .then((r) => r.json())
        .then((data) => {
          if (data.tracks && data.tracks.length > 0) {
            const ytTrack = data.tracks[0];
            track.videoId = ytTrack.videoId;
            setCurrentTrack({ ...track });
            loadTrack(track);
          } else {
            loadPreviewFallback(track);
          }
        })
        .catch((e) => {
          console.error('Dynamic YouTube resolution failed:', e);
          loadPreviewFallback(track);
        });
      return;
    }

    if ((track.source === 'gaana' || track.source === 'adyoutube') && track.playableLink) {
      stopHls();
      if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
      if (track.source === 'gaana' && track.playableLink.includes('.m3u8')) {
        playHls(track.playableLink);
      } else {
        const video = videoRef.current;
        if (video) {
          video.src = track.playableLink;
          video.play().catch(() => {});
        }
      }
    } else if (track.source === 'adyoutube' && track.videoId && !track.playableLink) {
      stopHls();
      if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
      fetch(`${API}/api/adyoutube/stream?videoId=${track.videoId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.streamUrl) {
            const video = videoRef.current;
            if (video) { video.src = data.streamUrl; video.play().catch(() => {}); }
          }
        })
        .catch((e) => console.error('AdYouTube stream failed:', e));
    } else if (track.videoId) {
      stopHls();
      if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
      fetch(`${API}/api/adyoutube/stream?videoId=${track.videoId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.streamUrl) {
            const video = videoRef.current;
            if (video) {
              video.src = data.streamUrl;
              video.play().catch((e) => {
                console.error('HTML5 play failed, falling back to YouTube iframe:', e);
                const loadYt = () => { if (playerRef.current?.loadVideoById) playerRef.current.loadVideoById(track.videoId); };
                if (playerReady) loadYt();
                else setTimeout(loadYt, 300);
              });
            }
          } else {
            const loadYt = () => { if (playerRef.current?.loadVideoById) playerRef.current.loadVideoById(track.videoId); };
            if (playerReady) loadYt();
            else setTimeout(loadYt, 300);
          }
        })
        .catch((err) => {
          console.warn('Direct stream resolution failed, falling back to YouTube iframe:', err);
          const loadYt = () => { if (playerRef.current?.loadVideoById) playerRef.current.loadVideoById(track.videoId); };
          if (playerReady) loadYt();
          else setTimeout(loadYt, 300);
        });
    } else if (track.previewUrl) {
      stopHls();
      const video = videoRef.current;
      if (video) {
        video.src = track.previewUrl;
        video.play().catch(() => {});
      }
    }
    setLyrics('');
    setShowLyrics(false);
    if (track.title && track.artist) {
      fetch(`${API}/api/music/lyrics?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}`)
        .then((r) => r.json())
        .then((d) => { if (d.lyrics) setLyrics(d.lyrics); })
        .catch((e) => console.error('Lyrics fetch failed:', e));
    }
  }, [playHls, stopHls, playerReady, loadPreviewFallback]);

  const generateShuffleOrder = useCallback((len) => {
    const order = Array.from({ length: len }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }, []);

  const getNextIndex = useCallback((currentIdx, tracks, mode) => {
    if (!tracks || tracks.length === 0) return -1;
    if (mode === 'shuffle') {
      if (shuffleOrderRef.current.length === 0) {
        shuffleOrderRef.current = generateShuffleOrder(tracks.length);
      }
      const pos = shuffleOrderRef.current.indexOf(currentIdx);
      const nextPos = pos + 1;
      if (nextPos >= shuffleOrderRef.current.length) {
        if (repeatRef.current === 'all') {
          shuffleOrderRef.current = generateShuffleOrder(tracks.length);
          return shuffleOrderRef.current[0];
        }
        return -1;
      }
      return shuffleOrderRef.current[nextPos];
    }
    if (currentIdx + 1 >= tracks.length) {
      if (repeatRef.current === 'all') return 0;
      return -1;
    }
    return currentIdx + 1;
  }, [generateShuffleOrder]);

  const getPrevIndex = useCallback((currentIdx, tracks, mode) => {
    if (!tracks || tracks.length === 0) return -1;
    if (mode === 'shuffle') {
      const pos = shuffleOrderRef.current.indexOf(currentIdx);
      if (pos > 0) return shuffleOrderRef.current[pos - 1];
      return currentIdx;
    }
    if (currentIdx > 0) return currentIdx - 1;
    return 0;
  }, []);

const ARTIST_SIMILARITY_MAP = {
  'ghulam ali': ['Jagjit Singh', 'Mehdi Hassan', 'Pankaj Udhas', 'Chitra Singh', 'Farida Khanum', 'Begum Akhtar'],
  'jagjit singh': ['Ghulam Ali', 'Pankaj Udhas', 'Chitra Singh', 'Mehdi Hassan', 'Bhupinder Singh', 'Talat Aziz'],
  'mehdi hassan': ['Ghulam Ali', 'Jagjit Singh', 'Pankaj Udhas', 'Farida Khanum', 'Abida Parveen', 'Iqbal Bano'],
  'pankaj udhas': ['Jagjit Singh', 'Ghulam Ali', 'Anup Jalota', 'Bhupinder Singh', 'Talat Aziz', 'Hariharan'],
  'chitra singh': ['Jagjit Singh', 'Ghulam Ali', 'Mehdi Hassan', 'Pankaj Udhas', 'Farida Khanum'],
  'abida parveen': ['Nusrat Fateh Ali Khan', 'Rahat Fateh Ali Khan', 'Farida Khanum', 'Wadali Brothers', 'Kailash Kher'],
  'nusrat fateh ali khan': ['Rahat Fateh Ali Khan', 'Abida Parveen', 'Sabri Brothers', 'Kailash Kher', 'Sukhwinder Singh'],
  'rahat fateh ali khan': ['Nusrat Fateh Ali Khan', 'Kailash Kher', 'Javed Ali', 'Shafqat Amanat Ali', 'Atif Aslam', 'Sonu Nigam'],
  'arijit singh': ['Atif Aslam', 'Jubin Nautiyal', 'Armaan Malik', 'Shreya Ghoshal', 'Mohit Chauhan', 'Ankit Tiwari', 'Mithoon', 'Pritam'],
  'pritam': ['Sachin-Jigar', 'Vishal-Shekhar', 'Amit Trivedi', 'Mithoon', 'Shankar-Ehsaan-Loy', 'A.R. Rahman', 'Arijit Singh'],
  'a.r. rahman': ['Hariharan', 'Bombay Jayashri', 'S.P. Balasubrahmanyam', 'Javed Ali', 'Shankar Mahadevan', 'Amit Trivedi', 'Pritam'],
  'lofi beats': ['ChilledCow', 'Lofi Girl', 'Feardog', 'Kudasai', 'Saib', 'Jinsang', 'Idealism', 'Nujabes'],
  'atif aslam': ['Arijit Singh', 'Rahat Fateh Ali Khan', 'Ali Zafar', 'Sonu Nigam', 'Shreya Ghoshal', 'Mohit Chauhan'],
  'diljit dosanjh': ['Guru Randhawa', 'Jassi Gill', 'Ammy Virk', 'Bilal Saeed', 'Harrdy Sandhu', 'Sidhu Moose Wala'],
  'sidhu moose wala': ['Karan Aujla', 'Diljit Dosanjh', 'Amrit Maan', 'AP Dhillon', 'Sharry Mann', 'Bohemia'],
  'ap dhillon': ['Gurinder Gill', 'Intense', 'Gminxr', 'Karan Aujla', 'Diljit Dosanjh'],
  'shreya ghoshal': ['Sunidhi Chauhan', 'Alka Yagnik', 'Kavita Krishnamurthy', 'Arijit Singh', 'Sonu Nigam'],
  'sonu nigam': ['Udit Narayan', 'Kumar Sanu', 'Abhijeet', 'Shaan', 'Babul Supriyo', 'Atif Aslam'],
  'udit narayan': ['Sonu Nigam', 'Kumar Sanu', 'Alka Yagnik', 'Kavita Krishnamurthy', 'Shaan'],
  'kumar sanu': ['Udit Narayan', 'Sonu Nigam', 'Alka Yagnik', 'Kavita Krishnamurthy', 'Abhijeet'],
  'alka yagnik': ['Shreya Ghoshal', 'Kavita Krishnamurthy', 'Udit Narayan', 'Kumar Sanu', 'Sonu Nigam'],
  'sachin-jigar': ['Pritam', 'Vishal-Shekhar', 'Amit Trivedi', 'Meet Bros', 'Tanishk Bagchi'],
  'vishal-shekhar': ['Pritam', 'Sachin-Jigar', 'Amit Trivedi', 'Shankar-Ehsaan-Loy', 'Salim-Sulaiman'],
  'lata mangeshkar': ['Asha Bhosle', 'Kishore Kumar', 'Mohammed Rafi', 'Mukesh', 'Hemant Kumar', 'Geeta Dutt', 'Manna Dey'],
  'asha bhosle': ['Lata Mangeshkar', 'Kishore Kumar', 'Mohammed Rafi', 'R.D. Burman', 'Mukesh'],
  'kishore kumar': ['Lata Mangeshkar', 'Asha Bhosle', 'Mohammed Rafi', 'R.D. Burman', 'Mukesh', 'Manna Dey'],
  'mohammed rafi': ['Kishore Kumar', 'Lata Mangeshkar', 'Asha Bhosle', 'Mukesh', 'Manna Dey'],
  'mukesh': ['Kishore Kumar', 'Lata Mangeshkar', 'Mohammed Rafi', 'Asha Bhosle'],
  'kk': ['Shaan', 'Sonu Nigam', 'Mohit Chauhan', 'Arijit Singh', 'Javed Ali', 'Lucky Ali'],
  'shaan': ['KK', 'Sonu Nigam', 'Udit Narayan', 'Kumar Sanu', 'Lucky Ali'],
  'mohit chauhan': ['Arijit Singh', 'Atif Aslam', 'KK', 'Lucky Ali', 'Jubin Nautiyal'],
  'lucky ali': ['KK', 'Shaan', 'Mohit Chauhan', 'Adnan Sami'],
  'taylor swift': ['Selena Gomez', 'Ariana Grande', 'Olivia Rodrigo', 'Billie Eilish', 'Ed Sheeran', 'Shawn Mendes'],
  'ed sheeran': ['Shawn Mendes', 'Taylor Swift', 'Justin Bieber', 'Coldplay', 'Lewis Capaldi'],
  'billie eilish': ['Olivia Rodrigo', 'Lana Del Rey', 'Lorde', 'Finneas', 'Khalid', 'Halsey'],
  'the weeknd': ['Drake', 'Post Malone', 'Bruno Mars', 'Khalid', 'Travis Scott', 'Rihanna'],
  'drake': ['Travis Scott', 'Post Malone', 'Kendrick Lamar', 'The Weeknd', 'J. Cole', 'Kanye West'],
  'coldplay': ['OneRepublic', 'Imagine Dragons', 'Maroon 5', 'Ed Sheeran', 'The Script'],
  'karan aujla': ['Sidhu Moose Wala', 'Diljit Dosanjh', 'AP Dhillon', 'Amrit Maan', 'Harrdy Sandhu'],
  'jubin nautiyal': ['Arijit Singh', 'Armaan Malik', 'Shreya Ghoshal', 'Atif Aslam'],
  'armaan malik': ['Arijit Singh', 'Jubin Nautiyal', 'Shreya Ghoshal', 'Darshan Raval']
};

const getSimilarArtistsLocal = (artistName) => {
  if (!artistName) return [];
  const clean = artistName.toLowerCase().trim();
  if (ARTIST_SIMILARITY_MAP[clean]) return ARTIST_SIMILARITY_MAP[clean];
  for (const key of Object.keys(ARTIST_SIMILARITY_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return ARTIST_SIMILARITY_MAP[key];
    }
  }
  return [];
};

  const fetchVibeRecommendations = useCallback(async (track) => {
    if (!track || !track.artist) return;
    try {
      let artistsToFetch = [track.artist];
      const localSim = getSimilarArtistsLocal(track.artist);
      if (localSim.length > 0) {
        artistsToFetch = [...artistsToFetch, ...localSim.slice(0, 4)];
      } else {
        const artistRes = await fetch(`${API}/api/music/recommend?artist=${encodeURIComponent(track.artist)}&limit=6`);
        const artistData = await artistRes.json();
        if (artistData.similar && artistData.similar.length > 0) {
          artistsToFetch = [...artistsToFetch, ...artistData.similar.slice(0, 4).map(a => a.name)];
        }
      }

      const fetchPromises = artistsToFetch.map(async (art) => {
        try {
          const res = await fetch(`${API}/api/music/artist-top?artist=${encodeURIComponent(art)}&limit=8`);
          const data = await res.json();
          return data.tracks || [];
        } catch {
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      const allTracks = results.flat();

      const cleanTrackTitle = (title) => (title || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
      const currentTitleClean = cleanTrackTitle(track.title);

      let candidates = allTracks.filter(t => {
        const isSame = cleanTrackTitle(t.title) === currentTitleClean && t.artist.toLowerCase() === track.artist.toLowerCase();
        return !isSame;
      });

      const getVibeKeywords = (title) => {
        const keywords = [
          'lofi', 'sad', 'romantic', 'slowed', 'reverb', 'remix', 'mashup', 'dance', 'party', 
          'acoustic', 'chill', 'version', 'theme', 'instrumental', 'punjabi', 'devotional',
          'ghazal', 'sufi', 'qawwali', 'bhajan', 'classical', 'unplugged', 'live', 'cover',
          'edm', 'hiphop', 'rap', 'pop', 'rock', 'club', 'dj', 'lo-fi', 'reverbed'
        ];
        return keywords.filter(kw => (title || '').toLowerCase().includes(kw));
      };

      const originalKeywords = getVibeKeywords(track.title);

      candidates = candidates.map(t => {
        let score = 0;
        if (t.artist.toLowerCase() === track.artist.toLowerCase()) score += 3;

        const tKeywords = getVibeKeywords(t.title);
        const matches = tKeywords.filter(k => originalKeywords.includes(k));
        score += matches.length * 5;
        score += Math.random() * 2;

        return { ...t, score };
      });

      candidates.sort((a, b) => b.score - a.score);

      const seen = new Set();
      const uniqueCandidates = [];
      for (const c of candidates) {
        const key = `${cleanTrackTitle(c.title)} - ${c.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCandidates.push(c);
        }
      }

      setRecommendedTracks(uniqueCandidates.slice(0, 15));
    } catch (err) {
      console.error('Vibe recommendations failed:', err);
    }
  }, []);

  useEffect(() => {
    if (currentTrack) {
      fetchVibeRecommendations(currentTrack);
    }
  }, [currentTrack, fetchVibeRecommendations]);

  const playAutoplayVibeNext = useCallback(async () => {
    if (!autoplayVibeRef.current) {
      setIsPlaying(false);
      return;
    }

    if (recommendedTracksRef.current.length > 0) {
      const nextTrack = recommendedTracksRef.current[0];
      setRecommendedTracks(prev => prev.slice(1));
      setCurrentTrack(nextTrack);
      setCurrentTrackIndex(-1);
      loadTrack(nextTrack);
      setIsPlaying(true);
      return;
    }

    // Fallback 1: Fetch recommendations on-the-fly for currentTrack
    if (currentTrack) {
      try {
        let artistsToFetch = [currentTrack.artist];
        const localSim = getSimilarArtistsLocal(currentTrack.artist);
        if (localSim.length > 0) {
          artistsToFetch = [...artistsToFetch, ...localSim.slice(0, 4)];
        } else {
          const artistRes = await fetch(`${API}/api/music/recommend?artist=${encodeURIComponent(currentTrack.artist)}&limit=6`);
          const artistData = await artistRes.json();
          if (artistData.similar && artistData.similar.length > 0) {
            artistsToFetch = [...artistsToFetch, ...artistData.similar.slice(0, 4).map(a => a.name)];
          }
        }

        const fetchPromises = artistsToFetch.map(async (art) => {
          try {
            const res = await fetch(`${API}/api/music/artist-top?artist=${encodeURIComponent(art)}&limit=8`);
            const data = await res.json();
            return data.tracks || [];
          } catch {
            return [];
          }
        });

        const results = await Promise.all(fetchPromises);
        const allTracks = results.flat();

        const cleanTrackTitle = (title) => (title || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
        const currentTitleClean = cleanTrackTitle(currentTrack.title);

        let candidates = allTracks.filter(t => {
          const isSame = cleanTrackTitle(t.title) === currentTitleClean && t.artist.toLowerCase() === currentTrack.artist.toLowerCase();
          return !isSame;
        });

        if (candidates.length > 0) {
          candidates = candidates.map(t => ({ ...t, score: Math.random() }));
          candidates.sort((a, b) => b.score - a.score);

          const seen = new Set();
          const uniqueCandidates = [];
          for (const c of candidates) {
            const key = `${cleanTrackTitle(c.title)} - ${c.artist.toLowerCase()}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueCandidates.push(c);
            }
          }

          if (uniqueCandidates.length > 0) {
            const nextTrack = uniqueCandidates[0];
            setRecommendedTracks(uniqueCandidates.slice(1, 15));
            setCurrentTrack(nextTrack);
            setCurrentTrackIndex(-1);
            loadTrack(nextTrack);
            setIsPlaying(true);
            return;
          }
        }
      } catch (err) {
        console.error('On-the-fly vibe recommendations failed:', err);
      }
    }

    // Fallback 2: Fetch trending list and play random
    try {
      const trendingRes = await fetch(`${API}/api/music/trending?country=india&limit=15`);
      const trendingData = await trendingRes.json();
      if (trendingData.tracks && trendingData.tracks.length > 0) {
        const nextTrack = trendingData.tracks[Math.floor(Math.random() * trendingData.tracks.length)];
        setCurrentTrack(nextTrack);
        setCurrentTrackIndex(-1);
        loadTrack(nextTrack);
        setIsPlaying(true);
        return;
      }
    } catch (err) {
      console.error('Ultimate fallback to trending failed:', err);
    }

    setIsPlaying(false);
  }, [currentTrack, loadTrack]);

  const handleTrackEnd = useCallback(() => {
    if (repeatRef.current === 'one') {
      if (playerRef.current?.seekTo) playerRef.current.seekTo(0, true);
      else if (videoRef.current) videoRef.current.currentTime = 0;
      return;
    }

    if (queueRef.current.length > 0) {
      const qi = queueIndexRef.current;
      if (qi + 1 < queueRef.current.length) {
        const next = queueRef.current[qi + 1];
        setQueueIndex(qi + 1);
        setCurrentTrack(next);
        setCurrentTrackIndex(-1);
        loadTrack(next);
      } else {
        setQueue([]);
        setQueueIndex(-1);
        playAutoplayVibeNext();
      }
      return;
    }

    if (autoplayVibeRef.current) {
      playAutoplayVibeNext();
      return;
    }

    const tracks = trackListRef.current;
    const idx = trackIndexRef.current;
    const mode = shuffleRef.current ? 'shuffle' : 'normal';

    if (idx === -1) {
      playAutoplayVibeNext();
      return;
    }

    const nIdx = getNextIndex(idx, tracks, mode);
    if (nIdx >= 0) {
      setCurrentTrack(tracks[nIdx]);
      setCurrentTrackIndex(nIdx);
      trackIndexRef.current = nIdx;
      loadTrack(tracks[nIdx]);
    } else {
      playAutoplayVibeNext();
    }
  }, [getNextIndex, loadTrack, playAutoplayVibeNext]);

  const goNext = useCallback(() => {
    if (repeatRef.current === 'one') {
      if (playerRef.current?.seekTo) playerRef.current.seekTo(0, true);
      else if (videoRef.current) videoRef.current.currentTime = 0;
      return;
    }

    if (queueRef.current.length > 0) {
      const qi = queueIndexRef.current;
      if (qi + 1 < queueRef.current.length) {
        const next = queueRef.current[qi + 1];
        setQueueIndex(qi + 1);
        setCurrentTrack(next);
        setCurrentTrackIndex(-1);
        loadTrack(next);
      } else {
        setQueue([]);
        setQueueIndex(-1);
        playAutoplayVibeNext();
      }
      return;
    }

    if (autoplayVibeRef.current) {
      playAutoplayVibeNext();
      return;
    }

    const tracks = trackListRef.current;
    const idx = trackIndexRef.current;
    const mode = shuffleRef.current ? 'shuffle' : 'normal';
    
    if (idx === -1) {
      playAutoplayVibeNext();
      return;
    }

    const nIdx = getNextIndex(idx, tracks, mode);
    if (nIdx >= 0) {
      if (queueRef.current.length > 0) setQueueIndex(nIdx);
      else { setCurrentTrackIndex(nIdx); trackIndexRef.current = nIdx; }
      setCurrentTrack(tracks[nIdx]);
      loadTrack(tracks[nIdx]);
    } else {
      playAutoplayVibeNext();
    }
  }, [getNextIndex, loadTrack, playAutoplayVibeNext]);

  const goPrevious = useCallback(() => {
    const tracks = queueRef.current.length > 0 ? queueRef.current : trackListRef.current;
    const idx = queueRef.current.length > 0 ? queueIndexRef.current : trackIndexRef.current;
    const mode = shuffleRef.current ? 'shuffle' : 'normal';
    const pIdx = getPrevIndex(idx, tracks, mode);
    if (pIdx >= 0) {
      if (queueRef.current.length > 0) setQueueIndex(pIdx);
      else { setCurrentTrackIndex(pIdx); trackIndexRef.current = pIdx; }
      setCurrentTrack(tracks[pIdx]);
      loadTrack(tracks[pIdx]);
    }
  }, [getPrevIndex, loadTrack]);

  const play = useCallback((track, index, tracks) => {
    trackListRef.current = tracks;
    trackIndexRef.current = index;
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
    setQueue([]);
    setQueueIndex(-1);
    if (shuffleRef.current && tracks.length > 1) {
      shuffleOrderRef.current = generateShuffleOrder(tracks.length);
    }
    loadTrack(track);
  }, [loadTrack, generateShuffleOrder]);

  const pause = useCallback(() => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (videoRef.current && videoRef.current.src) {
      videoRef.current.play().catch(() => {});
    }
    if (playerRef.current?.playVideo) playerRef.current.playVideo();
    setIsPlaying(true);
  }, []);

  const selectPlaylist = useCallback((playlist) => {
    setCurrentPlaylist(playlist);
    trackListRef.current = playlist.tracks;
    if (playlist.tracks.length > 0) {
      if (shuffleRef.current) {
        shuffleOrderRef.current = generateShuffleOrder(playlist.tracks.length);
        const firstIdx = shuffleOrderRef.current[0];
        play(playlist.tracks[firstIdx], firstIdx, playlist.tracks);
      } else {
        play(playlist.tracks[0], 0, playlist.tracks);
      }
    }
  }, [play, generateShuffleOrder]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      shuffleRef.current = next;
      if (next && trackListRef.current.length > 1) {
        const current = trackIndexRef.current;
        const order = generateShuffleOrder(trackListRef.current.length);
        const curPos = order.indexOf(current);
        if (curPos >= 0) {
          order.splice(curPos, 1);
          order.unshift(current);
        }
        shuffleOrderRef.current = order;
      }
      return next;
    });
  }, [generateShuffleOrder]);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => {
      const map = { off: 'all', all: 'one', one: 'off' };
      const next = map[prev];
      repeatRef.current = next;
      return next;
    });
  }, []);

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolumeState(clamped);
    if (videoRef.current) videoRef.current.volume = clamped / 100;
  }, []);

  const addToQueue = useCallback((track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const playFromQueue = useCallback((index, tracks) => {
    setQueue(tracks);
    setQueueIndex(index);
    setCurrentTrack(tracks[index]);
    setCurrentTrackIndex(-1);
    loadTrack(tracks[index]);
  }, [loadTrack]);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (index <= queueIndexRef.current && queueIndexRef.current > 0) {
        setQueueIndex((qi) => qi - 1);
      }
      return next;
    });
  }, []);

  const seekTo = useCallback((time) => {
    if (currentTrack?.source === 'gaana' && videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(time, true);
    }
  }, [currentTrack]);

  const refreshPlaylists = useCallback(async () => {
    try {
      const res = await fetch(API + '/api/playlists');
      const data = await res.json();
      setPlaylists(data);
      return data;
    } catch { return []; }
  }, []);

  return (
    <MusicContext.Provider
      value={{
        playlists,
        currentPlaylist,
        currentTrack,
        isPlaying,
        progress,
        queue, queueIndex,
        shuffle, repeat, volume,
        showLyrics, lyrics,
        play, pause, resume, goNext, goPrevious,
        selectPlaylist, seekTo,
        toggleShuffle, toggleRepeat, setVolume,
        addToQueue, playFromQueue, removeFromQueue,
        refreshPlaylists,
        setShowLyrics,
        setCurrentPlaylist,
        recommendedTracks,
        autoplayVibe,
        setAutoplayVibe,
      }}
    >
      {children}
      <div id="youtube-player" ref={playerContainerRef} style={{ width: 0, height: 0, overflow: 'hidden' }} />
      <video
        ref={videoRef}
        style={{ width: 0, height: 0, overflow: 'hidden' }}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => handleTrackEnd()}
      />
    </MusicContext.Provider>
  );
}

function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}

export { MusicProvider, useMusic };
