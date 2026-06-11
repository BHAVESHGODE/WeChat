import React, { useState, useEffect, useRef, useCallback } from 'react';

const BUILT_IN = [
  { id: 'white-noise', label: 'White Noise', icon: '🌊' },
  { id: 'pink-noise', label: 'Pink Noise', icon: '🌸' },
  { id: 'brown-noise', label: 'Brown Noise', icon: '🌫️' },
  { id: 'rain', label: 'Rain', icon: '🌧️' },
  { id: 'ocean', label: 'Ocean Waves', icon: '🌊' },
  { id: 'fire', label: 'Campfire', icon: '🔥' },
];

function AmbientSounds() {
  const [active, setActive] = useState(null);
  const [volume, setVolume] = useState(50);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const timerRef = useRef(null);

  const stopNoise = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) { /* */ }
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.close(); } catch (e) { /* */ }
      audioCtxRef.current = null;
    }
  }, []);

  const startNoise = useCallback((type) => {
    stopNoise();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = volume / 200;
    gain.connect(ctx.destination);
    gainNodeRef.current = gain;

    let source;
    if (type === 'white-noise') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
    } else if (type === 'pink-noise') {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
    } else if (type === 'brown-noise') {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
    } else if (type === 'rain') {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.random() * Math.random();
      }
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
    } else if (type === 'ocean') {
      const bufferSize = ctx.sampleRate * 6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let phase = 0;
      for (let i = 0; i < bufferSize; i++) {
        phase += 0.5 / ctx.sampleRate;
        const swell = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;
        data[i] = (Math.random() * 2 - 1) * swell * 0.6 + Math.sin(i * 0.1) * 0.1;
      }
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
    } else if (type === 'fire') {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (0.2 + Math.random() * 0.6 * (1 - (i % 1000) / 1000));
      }
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
    }
    if (source) {
      source.connect(gain);
      source.start();
      sourceNodeRef.current = source;
    }
  }, [volume, stopNoise]);

  useEffect(() => {
    if (!active) { stopNoise(); return; }
    startNoise(active);
    return () => stopNoise();
  }, [active, startNoise, stopNoise]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 200;
    }
  }, [volume]);

  useEffect(() => {
    if (!timerRunning || timer <= 0) return;
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { setTimerRunning(false); stopNoise(); setActive(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerRunning, stopNoise]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="gaana-section">
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>🌿 Ambient Sounds</h3>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {BUILT_IN.map((s) => (
          <button
            key={s.id}
            className={`pill-btn ${active === s.id ? 'primary' : 'secondary'}`}
            onClick={() => setActive(active === s.id ? null : s.id)}
            style={{ fontSize: '0.78rem', padding: '0.4rem 1rem' }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>🔊</span>
            <input
              type="range" min="0" max="100" value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: '120px', accentColor: 'var(--accent-1)' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', minWidth: '30px' }}>{volume}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="pill-btn secondary"
              onClick={() => { if (timerRunning) { clearInterval(timerRef.current); setTimerRunning(false); } else { setTimer(600); setTimerRunning(true); } }}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
            >
              {timerRunning ? `⏹ ${formatTime(timer)}` : '⏱ Sleep Timer'}
            </button>
            {timerRunning && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[300, 600, 900, 1800].map((t) => (
                  <button key={t} className="pill-btn secondary" onClick={() => setTimer(t)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>
                    {t >= 3600 ? `${t / 3600}h` : `${t / 60}m`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AmbientSounds;
