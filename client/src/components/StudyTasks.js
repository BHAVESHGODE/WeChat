import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL + '/api/tasks';
const STREAK_API = process.env.REACT_APP_API_URL + '/api/streaks';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'assignment', label: 'Assignments', icon: '📄' },
  { key: 'exam', label: 'Exams', icon: '📖' },
  { key: 'project', label: 'Projects', icon: '🚀' },
  { key: 'other', label: 'Other', icon: '📌' },
];

const PRIORITIES = [
  { key: 'urgent', label: 'Urgent', color: '#ff6b6b' },
  { key: 'high', label: 'High', color: '#ffa751' },
  { key: 'medium', label: 'Medium', color: '#7c4dff' },
  { key: 'low', label: 'Low', color: '#43e97b' },
];

function StudyTasks({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'assignment', priority: 'medium',
    estimatedTime: '', deadline: '',
  });

  const fetchTasks = useCallback(() => {
    fetch(`${API}/${userId}`)
      .then((r) => r.json())
      .then(setTasks)
      .catch((e) => console.error('Tasks fetch failed:', e));
  }, [userId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const check = setInterval(() => {
      const now = new Date();
      tasks.forEach((t) => {
        if (t.reminderTime && t.notifications !== false && t.status === 'pending') {
          const rt = new Date(t.reminderTime);
          if (rt <= now && rt > new Date(now - 65000)) {
            toast.info(`⏰ Reminder: "${t.title}" is due soon!`, { autoClose: 8000 });
          }
        }
      });
    }, 60000);
    return () => clearInterval(check);
  }, [tasks]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'assignment', priority: 'medium', estimatedTime: '', deadline: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const body = { ...form, userId, deadline: form.deadline || null };
    if (editingId) {
      fetch(`${API}/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((updated) => {
          setTasks((prev) => prev.map((t) => (t._id === editingId ? updated : t)));
          resetForm();
          toast.success('Task updated!');
        });
    } else {
      fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((created) => {
          setTasks((prev) => [created, ...prev]);
          resetForm();
          toast.success('Task added!');
        });
    }
  };

  const toggleStatus = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : task.status === 'in_progress' ? 'completed' : 'in_progress';
    fetch(`${API}/${task._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        if (newStatus === 'completed') {
          toast.success('✅ Task completed!');
          fetch(STREAK_API + '/task-complete', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
          }).catch((e) => console.error('Streak update after task complete failed:', e));
        }
      });
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title, description: task.description || '',
      category: task.category || 'assignment', priority: task.priority || 'medium',
      estimatedTime: task.estimatedTime || '', deadline: task.deadline ? task.deadline.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const deleteTask = (id) => {
    fetch(`${API}/${id}`, { method: 'DELETE' }).then(() => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast('🗑️ Task deleted');
    });
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.category === filter);

  const getPriorityColor = (p) => {
    const found = PRIORITIES.find((pr) => pr.key === p);
    return found ? found.color : '#7c4dff';
  };

  const categoryCounts = {};
  CATEGORIES.forEach((c) => {
    if (c.key === 'all') categoryCounts.all = tasks.length;
    else categoryCounts[c.key] = tasks.filter((t) => t.category === c.key).length;
  });

  return (
    <div className="sz-tasks">
      <div className="sz-tasks-header">
        <h2 className="sz-section-title">✅ Tasks</h2>
        <button className="pill-btn primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Close' : '➕ New Task'}
        </button>
      </div>

      {showForm && (
        <form className="sz-task-form glass-card" onSubmit={handleSubmit}>
          <div className="sz-task-form-row">
            <input className="sz-input" name="title" placeholder="Task title" value={form.title} onChange={handleChange} required />
            <select className="sz-select" name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
            <select className="sz-select" name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
          <textarea className="sz-textarea" name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} rows={2} />
          <div className="sz-task-form-row">
            <input className="sz-input" name="estimatedTime" type="number" placeholder="Est. minutes" value={form.estimatedTime} onChange={handleChange} />
            <input className="sz-input" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
            <button className="pill-btn primary" type="submit">{editingId ? '✏️ Update' : '➕ Add'}</button>
            {editingId && (
              <button className="pill-btn secondary" type="button" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      )}

      <div className="sz-category-pills">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`sz-category-pill ${filter === c.key ? 'active' : ''}`}
            onClick={() => setFilter(c.key)}
          >
            {c.icon} {c.label} <span className="sz-category-count">{categoryCounts[c.key] || 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="sz-empty">
          <span className="sz-empty-icon">📋</span>
          <p>No tasks here yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="sz-masonry">
          {filtered.map((task) => (
            <div key={task._id} className={`sz-task-card glass-card ${task.status}`}>
              <div className="sz-task-card-top">
                <span className="sz-task-category-tag" style={{ borderColor: getPriorityColor(task.priority) }}>
                  {CATEGORIES.find((c) => c.key === task.category)?.icon} {task.category}
                </span>
                <span className="sz-task-priority-dot" style={{ backgroundColor: getPriorityColor(task.priority) }} title={PRIORITIES.find((p) => p.key === task.priority)?.label} />
              </div>
              <h3 className={`sz-task-card-title ${task.status === 'completed' ? 'done' : ''}`}>{task.title}</h3>
              {task.description && <p className="sz-task-card-desc">{task.description}</p>}
              <div className="sz-task-card-meta">
                {task.deadline && <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>}
                {task.estimatedTime > 0 && <span>⏱ {task.estimatedTime}m</span>}
              </div>
              <div className="sz-task-card-status-row">
                <button
                  className={`sz-status-btn ${task.status}`}
                  onClick={() => toggleStatus(task)}
                >
                  {task.status === 'completed' ? '✅ Done' : task.status === 'in_progress' ? '🔄 In Progress' : '⭕ Pending'}
                </button>
              </div>
              <div className="sz-task-card-actions">
                <button className="sz-icon-btn" onClick={() => startEdit(task)} title="Edit">✏️</button>
                <button className="sz-icon-btn" onClick={() => deleteTask(task._id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudyTasks;
