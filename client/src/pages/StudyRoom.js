import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Timer from '../components/Timer';
import AudioPlayer from '../components/AudioPlayer';
import Quotes from '../components/Quotes';
import Planner from '../components/Planner';
import FocusMode from '../components/FocusMode';
import OfflineNotes from '../components/OfflineNotes';

function StudyRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = searchParams.get('user') || 'Maverick';

  const [focusMode, setFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusIntervalRef = useRef(null);

  useEffect(() => {
    if (focusRunning && focusSeconds > 0) {
      focusIntervalRef.current = setInterval(() => {
        setFocusSeconds((prev) => {
          if (prev <= 1) {
            setFocusRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(focusIntervalRef.current);
  }, [focusRunning, focusSeconds]);

  const handleFocusStart = () => {
    setFocusMode(true);
    setFocusRunning(true);
  };

  return (
    <>
      {focusMode && (
        <FocusMode
          seconds={focusSeconds}
          running={focusRunning}
          onPause={() => setFocusRunning(false)}
          onResume={() => setFocusRunning(true)}
          onReset={() => { setFocusSeconds(25 * 60); setFocusRunning(false); }}
          onExit={() => { setFocusMode(false); setFocusRunning(false); setFocusSeconds(25 * 60); }}
        />
      )}
      <div className="study-room">
        <button className="back-btn" onClick={() => navigate(`/${user.toLowerCase()}`)}>
          ← Dashboard
        </button>
        <h1 className="study-room-title">📚 Study Room</h1>
        <p className="study-room-subtitle">Welcome, {user}! Stay focused and productive.</p>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button className="study-btn timer-btn" onClick={handleFocusStart} style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
            🎯 Focus Mode
          </button>
        </div>

        <div className="study-grid">
          <Timer />
          <AudioPlayer />
          <Quotes />
        </div>

        <Planner userId={user} />
        <OfflineNotes />
      </div>
    </>
  );
}

export default StudyRoom;
