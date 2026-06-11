import React, { useState, useEffect, useRef } from 'react';

const API = process.env.REACT_APP_API_URL;

const BUILT_IN = [
  { id: 'white-noise', label: '🌊 White Noise', type: 'generated' },
  { id: 'pink-noise', label: '🌸 Pink Noise', type: 'generated' },
  { id: 'brown-noise', label: '🌫️ Brown Noise', type: 'generated' },
];

const quotes = [
  'You are capable of amazing things.',
  'Stay focused. Stay persistent.',
  'Small steps lead to big results.',
  'Believe in the process.',
  "You've got this!",
  'Breathe. Focus. Succeed.',
  'Every second counts.',
];

function FocusMode({ seconds, running, onPause, onResume, onReset, onExit }) {
  const [ambient, setAmbient] = useState(null);
  const [volume, setVolume] = useState(50);
  const [customSounds, setCustomSounds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);
  const [showParticles, setShowParticles] = useState(true);

  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioElementRef = useRef(null);
  const fileInputRef = useRef(null);

  // Quotes rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch custom sounds
  useEffect(() => {
    fetch(`${API}/api/ambient`)
      .then((r) => r.json())
      .then((data) => setCustomSounds(data.filter((s) => s.type === 'file')))
      .catch((e) => console.error('Custom sounds fetch failed:', e));
  }, []);

  const stopSound = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) { /* ignore */ }
      sourceNodeRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
  };

  const playGenerated = (type) => {
    stopSound();
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const sampleRate = ctx.sampleRate;
    const duration = 10;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white-noise') {
        data[i] = white;
      } else if (type === 'pink-noise') {
        // Pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        // Brown noise
        let lastOut = 0;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume / 100;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();

    sourceNodeRef.current = source;
    gainNodeRef.current = gainNode;
  };

  const playFile = (sound) => {
    stopSound();
    const audio = new Audio();
    audio.src = `${API}${sound.url}`;
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch(() => {});
    audioElementRef.current = audio;
  };

  const toggleAmbient = (sound) => {
    if (ambient?.id === sound.id) {
      stopSound();
      setAmbient(null);
    } else {
      stopSound();
      setAmbient(sound);
      if (sound.type === 'generated') {
        playGenerated(sound.id.replace('-noise', ''));
      } else {
        playFile(sound);
      }
    }
  };

  // Update volume on slider change
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('name', file.name.replace(/\.[^.]+$/, ''));
    try {
      const res = await fetch(`${API}/api/ambient/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const newSound = await res.json();
        setCustomSounds((prev) => [...prev, newSound]);
      }
    } catch (e) { /* ignore */ }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/api/ambient/${id}`, { method: 'DELETE' });
      setCustomSounds((prev) => prev.filter((s) => s.id !== id));
      if (ambient?.id === id) { stopSound(); setAmbient(null); }
    } catch (e) { /* ignore */ }
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="focus-overlay">
      {showParticles && (
        <div className="focus-particles">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="focus-particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
            }} />
          ))}
        </div>
      )}

      <button className="focus-exit-btn" onClick={onExit}>✕ Exit Focus</button>

      <div className="focus-content">
        <div className="focus-timer">
          <div className="focus-display">{display}</div>
          <div className="focus-buttons">
            {!running ? (
              <button className="focus-btn focus-btn-primary" onClick={onResume}>▶ Resume</button>
            ) : (
              <button className="focus-btn focus-btn-primary" onClick={onPause}>⏸ Pause</button>
            )}
            <button className="focus-btn focus-btn-secondary" onClick={onReset}>↺ Reset</button>
          </div>
        </div>

        <p className="focus-quote">"{quote}"</p>

        <div className="focus-ambient">
          <p className="focus-ambient-label">Ambient Sounds</p>
          <div className="focus-ambient-buttons">
            {BUILT_IN.map((s) => (
              <button
                key={s.id}
                className={`focus-ambient-btn ${ambient?.id === s.id ? 'active' : ''}`}
                onClick={() => toggleAmbient(s)}
              >
                {s.label}
              </button>
            ))}
            {customSounds.map((s) => (
              <div key={s.id} className="focus-ambient-item">
                <button
                  className={`focus-ambient-btn ${ambient?.id === s.id ? 'active' : ''}`}
                  onClick={() => toggleAmbient(s)}
                >
                  {s.icon || '🎵'} {s.name}
                </button>
                <button className="focus-ambient-del" onClick={() => handleDelete(s.id)} title="Delete">✕</button>
              </div>
            ))}
          </div>

          {ambient && (
            <div className="focus-volume-row">
              <span className="focus-volume-label">🔊 Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="focus-volume-slider"
              />
              <span className="focus-volume-val">{volume}%</span>
            </div>
          )}

          <div className="focus-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              className="focus-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload Sound'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FocusMode;
