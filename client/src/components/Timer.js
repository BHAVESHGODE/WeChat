import React, { useState, useEffect, useRef } from 'react';

const POMODORO = 25 * 60;

function Timer({ onFocusMode }) {
  const [seconds, setSeconds] = useState(POMODORO);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setSeconds(POMODORO);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="study-card timer-card">
      <h2 className="study-card-title">⏳ Pomodoro Timer</h2>
      <div className="timer-display">{display}</div>
      <div className="timer-buttons">
        {!running ? (
          <button className="study-btn timer-btn" onClick={start}>▶ Start</button>
        ) : (
          <button className="study-btn timer-btn" onClick={pause}>⏸ Pause</button>
        )}
        <button className="study-btn timer-btn timer-reset" onClick={reset}>↺ Reset</button>
      </div>
    </div>
  );
}

export default Timer;
