import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL + '/api/streaks';

const PRESETS = [
  { label: 'Focus 25', work: 25, break: 5 },
  { label: 'Focus 50', work: 50, break: 10 },
  { label: 'Focus 15', work: 15, break: 3 },
];

function StudyPomodoro({ userId }) {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [workMins, setWorkMins] = useState(preset.work);
  const [breakMins, setBreakMins] = useState(preset.break);
  const [mode, setMode] = useState('work');
  const [seconds, setSeconds] = useState(preset.work * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [customizing, setCustomizing] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const total = mode === 'work' ? workMins * 60 : breakMins * 60;
    setSeconds(total);
  }, [workMins, breakMins, mode]);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((p) => p - 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      if (mode === 'work') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        toast.success('🎉 Work session complete! Take a break!');
        fetch(API + '/session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, minutes: workMins }),
        }).catch((e) => console.error('Session log failed:', e));
        setMode('break');
        setSeconds(breakMins * 60);
      } else {
        toast.info('☕ Break over! Time to focus!');
        setMode('work');
        setSeconds(workMins * 60);
      }
    }
  }, [seconds, running, mode, userId, workMins, breakMins, sessions]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setSessions(0); setMode('work'); setSeconds(workMins * 60); };

  const applyPreset = (p) => {
    setPreset(p); setWorkMins(p.work); setBreakMins(p.break);
    setRunning(false); setMode('work'); setSeconds(p.work * 60); setCustomizing(false);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progress = mode === 'work'
    ? ((workMins * 60 - seconds) / (workMins * 60)) * 100
    : ((breakMins * 60 - seconds) / (breakMins * 60)) * 100;

  return (
    <div className="sz-pomodoro">
      <div className="sz-pomodoro-header">
        <h2 className="sz-section-title">⏳ Pomodoro Timer</h2>
        <button className="pill-btn secondary" onClick={() => setCustomizing(!customizing)}>
          ⚙️ Customize
        </button>
      </div>

      <div className="sz-pomodoro-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`sz-preset-btn ${preset.label === p.label && !customizing ? 'active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {customizing && (
        <div className="sz-pomodoro-custom glass-card">
          <div className="sz-custom-row">
            <label>Work (min)</label>
            <input type="number" min="1" max="120" value={workMins} onChange={(e) => setWorkMins(Number(e.target.value))} />
          </div>
          <div className="sz-custom-row">
            <label>Break (min)</label>
            <input type="number" min="1" max="60" value={breakMins} onChange={(e) => setBreakMins(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="sz-pomodoro-ring">
        <svg viewBox="0 0 220 220" className="sz-pomodoro-svg">
          <circle cx="110" cy="110" r="95" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="110" cy="110" r="95" fill="none"
            stroke={mode === 'work' ? 'var(--accent-1)' : 'var(--accent-2)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 95}`}
            strokeDashoffset={`${2 * Math.PI * 95 * (1 - progress / 100)}`}
            transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="sz-pomodoro-display">
          <span className="sz-pomodoro-time">{display}</span>
          <span className="sz-pomodoro-mode">{mode === 'work' ? '🎯 Focus' : '☕ Break'}</span>
        </div>
      </div>

      <div className="sz-pomodoro-controls">
        {!running ? (
          <button className="pill-btn primary glow" onClick={start}>▶ Start</button>
        ) : (
          <button className="pill-btn primary glow" onClick={pause}>⏸ Pause</button>
        )}
        <button className="pill-btn secondary" onClick={reset}>↺ Reset</button>
      </div>

      <div className="sz-pomodoro-stats">
        <span>Completed sessions today: <strong>{sessions}</strong></span>
      </div>
    </div>
  );
}

export default StudyPomodoro;
