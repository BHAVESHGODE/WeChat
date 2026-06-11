import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL + '/api/tasks';

function Planner({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', reminderTime: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(`${API}/${userId}`)
      .then((r) => r.json())
      .then(setTasks)
      .catch((e) => console.error('Planner tasks fetch failed:', e));
  }, [userId]);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const body = {
      ...form,
      userId,
      deadline: form.deadline || null,
      reminderTime: form.reminderTime || null,
    };

    if (editingId) {
      fetch(`${API}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((updated) => {
          setTasks((prev) => prev.map((t) => (t._id === editingId ? updated : t)));
          setEditingId(null);
          setForm({ title: '', description: '', deadline: '', reminderTime: '' });
          toast.success('Task updated!');
        });
    } else {
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((created) => {
          setTasks((prev) => [created, ...prev]);
          setForm({ title: '', description: '', deadline: '', reminderTime: '' });
          toast.success('Task added!');
        });
    }
  };

  const toggleStatus = (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    fetch(`${API}/${task._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        if (newStatus === 'completed') toast.success('✅ Task completed!');
      });
  };

  const toggleNotifications = (task) => {
    const newVal = task.notifications === false;
    fetch(`${API}/${task._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications: newVal }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        toast.info(newVal ? '🔔 Notifications on' : '🔕 Notifications off');
      });
  };

  const syncToCalendar = (task) => {
    toast.info('📅 Calendar sync requires Google OAuth setup. Add GOOGLE_CLIENT_ID to .env');
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
      reminderTime: task.reminderTime ? task.reminderTime.slice(0, 16) : '',
    });
  };

  const deleteTask = (id) => {
    fetch(`${API}/${id}`, { method: 'DELETE' }).then(() => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast('🗑️ Task deleted');
    });
  };

  return (
    <div className="study-card planner-card">
      <h2 className="study-card-title">📋 Task Planner</h2>

      <form className="planner-form" onSubmit={handleSubmit}>
        <input className="planner-input" name="title" placeholder="Task title" value={form.title} onChange={handleChange} required />
        <input className="planner-input" name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input className="planner-input" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
        <input className="planner-input" name="reminderTime" type="datetime-local" value={form.reminderTime} onChange={handleChange} />
        <button className="study-btn planner-submit" type="submit">{editingId ? '✏️ Update' : '➕ Add'}</button>
        {editingId && (
          <button className="study-btn planner-cancel" type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', deadline: '', reminderTime: '' }); }}>Cancel</button>
        )}
      </form>

      <div className="planner-list">
        {tasks.length === 0 && <p className="planner-empty">No tasks yet. Add one above!</p>}
        {tasks.map((task) => (
          <div key={task._id} className={`planner-task ${task.status}`}>
            <div className="planner-task-info">
              <span className={`planner-task-title ${task.status === 'completed' ? 'done' : ''}`} onClick={() => toggleStatus(task)}>
                {task.status === 'completed' ? '✓' : '○'} {task.title}
              </span>
              {task.description && <p className="planner-task-desc">{task.description}</p>}
              {task.deadline && <p className="planner-task-deadline">📅 {new Date(task.deadline).toLocaleDateString()}</p>}
              {task.reminderTime && <p className="planner-task-deadline">⏰ {new Date(task.reminderTime).toLocaleString()}</p>}
              {task.googleEventId && <p className="planner-task-deadline">✅ Synced to Calendar</p>}
            </div>
            <div className="planner-task-actions">
              <button className="planner-icon-btn" onClick={() => toggleNotifications(task)} title={task.notifications !== false ? 'Mute reminders' : 'Enable reminders'}>
                {task.notifications !== false ? '🔔' : '🔕'}
              </button>
              <button className="planner-icon-btn" onClick={() => syncToCalendar(task)} title="Sync to Google Calendar">📅</button>
              <button className="planner-icon-btn" onClick={() => startEdit(task)}>✏️</button>
              <button className="planner-icon-btn" onClick={() => deleteTask(task._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Planner;
