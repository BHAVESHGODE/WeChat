import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL + '/api/streaks';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StudyProgress({ userId }) {
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [badges, setBadges] = useState([]);
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState('streaks');

  useEffect(() => {
    fetch(`${API}/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setStreak(data.currentStreak || 0);
        setTotalMinutes(data.totalMinutes || 0);
        setActiveDays(data.activeDays || 0);
        setTotalSessions(data.totalSessions || 0);
        setLogs(data.logs || []);
      })
      .catch((e) => console.error('Streak fetch failed:', e));
    fetch(`${API}/${userId}/badges`)
      .then((r) => r.json())
      .then((data) => setBadges(data.badges || []))
      .catch((e) => console.error('Badges fetch failed:', e));
  }, [userId]);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayName = WEEKDAYS[d.getDay()];
    const log = logs.find((l) => l.date === key);
    last7.push({ day: dayName, date: key, minutes: log ? log.studyMinutes : 0, tasks: log ? log.tasksCompleted : 0 });
  }

  return (
    <div className="sz-progress">
      <h2 className="sz-section-title">🏆 Progress</h2>

      <div className="sz-progress-tabs">
        <button className={`sz-progress-tab ${view === 'streaks' ? 'active' : ''}`} onClick={() => setView('streaks')}>
          🔥 Streaks
        </button>
        <button className={`sz-progress-tab ${view === 'badges' ? 'active' : ''}`} onClick={() => setView('badges')}>
          🏅 Badges
        </button>
      </div>

      {view === 'streaks' && (
        <>
          <div className="sz-streak-hero glass-card">
            <div className="sz-streak-flame">
              <span className="sz-streak-emoji">{streak >= 7 ? '🔥' : streak >= 3 ? '⭐' : '🌱'}</span>
              <span className="sz-streak-number">{streak}</span>
              <span className="sz-streak-label">day streak</span>
            </div>
          </div>

          <div className="sz-stats-grid">
            <div className="sz-stat-card glass-card">
              <span className="sz-stat-icon">⏱</span>
              <span className="sz-stat-value">{hours}h {mins}m</span>
              <span className="sz-stat-label">Total Study Time</span>
            </div>
            <div className="sz-stat-card glass-card">
              <span className="sz-stat-icon">📅</span>
              <span className="sz-stat-value">{activeDays}</span>
              <span className="sz-stat-label">Active Days</span>
            </div>
            <div className="sz-stat-card glass-card">
              <span className="sz-stat-icon">🔄</span>
              <span className="sz-stat-value">{totalSessions}</span>
              <span className="sz-stat-label">Sessions</span>
            </div>
          </div>

          <div className="sz-week-chart glass-card">
            <h3 className="sz-week-chart-title">This Week</h3>
            <div className="sz-week-bars">
              {last7.map((day) => (
                <div key={day.date} className="sz-week-bar-item" title={`${day.day}: ${day.minutes}m study, ${day.tasks} tasks`}>
                  <div className="sz-week-bar-track">
                    <div
                      className="sz-week-bar-fill"
                      style={{ height: `${Math.min(100, (day.minutes / 120) * 100)}%` }}
                    />
                  </div>
                  <span className="sz-week-bar-label">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'badges' && (
        <div className="sz-badges-grid">
          {badges.length === 0 ? (
            <div className="sz-empty">
              <span className="sz-empty-icon">🏅</span>
              <p>Complete study sessions to earn badges!</p>
            </div>
          ) : (
            badges.map((badge) => (
              <div key={badge.id} className={`sz-badge-card glass-card ${badge.earned ? 'earned' : 'locked'}`}>
                <span className="sz-badge-icon">{badge.earned ? badge.icon : '🔒'}</span>
                <div className="sz-badge-info">
                  <h4 className="sz-badge-name">{badge.name}</h4>
                  <p className="sz-badge-desc">{badge.minDays}-day streak required</p>
                </div>
                <div className="sz-badge-progress-track">
                  <div className="sz-badge-progress-fill" style={{ width: `${badge.progress}%` }} />
                </div>
                <span className="sz-badge-progress-text">{badge.progress}%</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default StudyProgress;
