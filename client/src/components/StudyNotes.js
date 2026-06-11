import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL + '/api/notes';

const COLORS = ['#7c4dff', '#43e97b', '#ff6b9d', '#00d4ff', '#ffa751', '#ff6b6b', '#a78bfa', '#34d399'];

function StudyNotes({ userId }) {
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#7c4dff');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const contentRef = useRef(null);

  const fetchNotes = useCallback(() => {
    fetch(`${API}/${userId}`)
      .then((r) => r.json())
      .then(setNotes)
      .catch((e) => console.error('Notes fetch failed:', e));
  }, [userId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const resetForm = () => {
    setTitle(''); setContent(''); setColor('#7c4dff'); setEditingId(null); setShowForm(false);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) { toast('Note is empty'); return; }
    const body = { title: title.trim() || 'Untitled Note', content, color, tags: [], userId };
    if (editingId) {
      fetch(`${API}/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((updated) => {
          setNotes((prev) => prev.map((n) => (n._id === editingId ? updated : n)));
          resetForm();
          toast.success('Note saved!');
        });
    } else {
      fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((created) => {
          setNotes((prev) => [created, ...prev]);
          resetForm();
          toast.success('Note created!');
        });
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id); setTitle(note.title); setContent(note.content);
    setColor(note.color || '#7c4dff'); setShowForm(true);
  };

  const deleteNote = (id) => {
    fetch(`${API}/${id}`, { method: 'DELETE' }).then(() => {
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast('🗑️ Note deleted');
    });
  };

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    contentRef.current?.focus();
  };

  const handleContentInput = () => {
    if (contentRef.current) setContent(contentRef.current.innerHTML);
  };

  return (
    <div className="sz-notes">
      <div className="sz-notes-header">
        <h2 className="sz-section-title">📝 Notes</h2>
        <div className="sz-notes-actions">
          <input
            className="sz-search-input"
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="pill-btn primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? '✕ Close' : '➕ New Note'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="sz-note-editor glass-card">
          <input
            className="sz-input sz-note-title-input"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="sz-note-toolbar">
            <button type="button" className="sz-toolbar-btn" onClick={() => execCmd('bold')} title="Bold"><strong>B</strong></button>
            <button type="button" className="sz-toolbar-btn" onClick={() => execCmd('italic')} title="Italic"><em>I</em></button>
            <button type="button" className="sz-toolbar-btn" onClick={() => execCmd('underline')} title="Underline"><u>U</u></button>
            <button type="button" className="sz-toolbar-btn" onClick={() => execCmd('insertUnorderedList')} title="List">•</button>
            <button type="button" className="sz-toolbar-btn" onClick={() => execCmd('formatBlock', 'h3')} title="Heading">H</button>
            <button type="button" className="sz-toolbar-btn" onClick={() => execCmd('hiliteColor', '#fff3cd')} title="Highlight">🖍</button>
            <span className="sz-toolbar-sep" />
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`sz-color-dot ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title="Note color"
              />
            ))}
          </div>
          <div
            ref={contentRef}
            className="sz-note-content-editable"
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            data-placeholder="Write your note here..."
          />
          <div className="sz-note-editor-actions">
            <button className="pill-btn primary" onClick={handleSave}>
              {editingId ? '💾 Update' : '💾 Save'}
            </button>
            <button className="pill-btn secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="sz-empty">
          <span className="sz-empty-icon">📝</span>
          <p>{search ? 'No notes match your search.' : 'No notes yet. Create one!'}</p>
        </div>
      ) : (
        <div className="sz-masonry">
          {filtered.map((note) => (
            <div
              key={note._id}
              className="sz-note-card glass-card"
              style={{ borderTop: `3px solid ${note.color || '#7c4dff'}` }}
            >
              <div className="sz-note-card-header">
                <h3 className="sz-note-card-title">{note.title}</h3>
                <div className="sz-note-card-actions">
                  <button className="sz-icon-btn" onClick={() => startEdit(note)} title="Edit">✏️</button>
                  <button className="sz-icon-btn" onClick={() => deleteNote(note._id)} title="Delete">🗑️</button>
                </div>
              </div>
              <div
                className="sz-note-card-content"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
              <div className="sz-note-card-footer">
                <span className="sz-note-date">{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudyNotes;
