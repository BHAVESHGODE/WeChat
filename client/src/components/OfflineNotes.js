import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'wegift_offline_notes';

function OfflineNotes() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setNotes(saved);
    } catch { setNotes([]); }
  }, []);

  const saveNotes = (updated) => {
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addNote = () => {
    if (!text.trim()) return;
    const note = { id: Date.now(), text: text.trim(), createdAt: new Date().toISOString() };
    saveNotes([note, ...notes]);
    setText('');
  };

  const deleteNote = (id) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="study-card" style={{ maxWidth: 700, margin: '1rem auto' }}>
      <h2 className="study-card-title">📝 Offline Notes</h2>
      <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.75rem' }}>
        These notes are saved in your browser and work even when offline.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          className="planner-input"
          style={{ flex: 1 }}
          placeholder="Write a quick note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
        <button className="study-btn timer-btn" onClick={addNote}>➕ Add</button>
      </div>
      {notes.length === 0 && <p className="planner-empty">No notes yet.</p>}
      {notes.map((note) => (
        <div key={note.id} className="planner-task" style={{ marginBottom: '0.4rem' }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#4a4a6a' }}>{note.text}</p>
            <p className="planner-task-deadline">{new Date(note.createdAt).toLocaleString()}</p>
          </div>
          <button className="planner-icon-btn" onClick={() => deleteNote(note.id)}>🗑️</button>
        </div>
      ))}
    </div>
  );
}

export default OfflineNotes;
