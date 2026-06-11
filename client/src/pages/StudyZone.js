import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import StudySidebar from '../components/StudySidebar';
import StudyTasks from '../components/StudyTasks';
import StudyNotes from '../components/StudyNotes';
import StudyPomodoro from '../components/StudyPomodoro';
import StudyProgress from '../components/StudyProgress';
import StudyQuote from '../components/StudyQuote';
import StudyWordOfDay from '../components/StudyWordOfDay';
import StudyJokeFacts from '../components/StudyJokeFacts';
import '../styles/StudyZone.css';

function StudyZone() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = searchParams.get('user') || 'Maverick';
  const path = location.pathname;

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const renderSection = () => {
    if (path.includes('tasks')) {
      return <StudyTasks userId={user} />;
    }
    if (path.includes('notes')) {
      return <StudyNotes userId={user} />;
    }
    if (path.includes('timer')) {
      return <StudyPomodoro userId={user} />;
    }
    if (path.includes('progress')) {
      return <StudyProgress userId={user} />;
    }
    return (
      <div className="sz-overview">
        <StudyQuote />
        <StudyWordOfDay />
        <StudyJokeFacts />

        <div className="sz-overview-grid">
          <div className="sz-overview-card glass-card" onClick={() => navigate(`/study-zone/tasks?user=${user}`)}>
            <span className="sz-overview-icon">✅</span>
            <h3>Tasks</h3>
            <p>Manage assignments, exams, and projects</p>
          </div>
          <div className="sz-overview-card glass-card" onClick={() => navigate(`/study-zone/notes?user=${user}`)}>
            <span className="sz-overview-icon">📝</span>
            <h3>Notes</h3>
            <p>Write and organize your study notes</p>
          </div>
          <div className="sz-overview-card glass-card" onClick={() => navigate(`/study-zone/timer?user=${user}`)}>
            <span className="sz-overview-icon">⏳</span>
            <h3>Pomodoro</h3>
            <p>Focus with customizable work/break intervals</p>
          </div>
          <div className="sz-overview-card glass-card" onClick={() => navigate(`/study-zone/progress?user=${user}`)}>
            <span className="sz-overview-icon">🏆</span>
            <h3>Progress</h3>
            <p>Track streaks, badges, and study hours</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sz-layout">
      <StudySidebar user={user} />
      <div className="sz-main">
        <div className="sz-topbar">
          <div className="sz-topbar-left">
            <h1 className="sz-topbar-title">
              {greeting}, {user}
            </h1>
            <p className="sz-topbar-subtitle">Stay focused and productive</p>
          </div>
          <div className="sz-topbar-right">
            <input className="sz-topbar-search" type="text" placeholder="Search..." readOnly />
          </div>
        </div>
        <div className="sz-main-scroll">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

export default StudyZone;
