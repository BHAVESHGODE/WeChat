import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL + '/api/conversation';

function VentingRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = searchParams.get('user') || 'Maverick';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [safeSpace, setSafeSpace] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/${user}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch((e) => console.error('Venting messages fetch failed:', e));
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    const tempId = Date.now();
    const tempUser = { _tempId: tempId, sender: 'user', text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUser]);

    try {
      const res = await fetch(`${API}/${user}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, safeSpace }),
      });
      const data = await res.json();

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m._tempId !== tempId);
        return [...withoutTemp, data.userMessage, data.aiMessage];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Clear all messages?')) return;
    try {
      await fetch(`${API}/${user}`, { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="venting-page">
      <button className="back-btn" onClick={() => navigate(`/${user.toLowerCase()}`)}>
        ← Dashboard
      </button>

      <div className="venting-header">
        <h1 className="venting-title">💬 Chalo Baat Karte Hai</h1>
        <p className="venting-subtitle">A safe space to vent, {user} ❤️</p>
        <div className="safe-space-toggle">
          <label className="toggle-label">
            <input type="checkbox" checked={safeSpace} onChange={() => setSafeSpace(!safeSpace)} />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-text">Safe Space Mode {safeSpace ? '🛡️' : ''}</span>
          </label>
        </div>
      </div>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>{safeSpace ? 'You are in a safe, judgment-free space. Share what\'s in your heart.' : 'How are you feeling today?'}</p>
            <p className="chat-empty-hint">Type anything — I'm here to listen.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
            <div className="chat-bubble-content">
              {msg.sender === 'ai' && <span className="chat-avatar">{safeSpace ? '🛡️' : '🤗'}</span>}
              <p className="chat-text">{msg.text}</p>
              {msg.sender === 'user' && <span className="chat-avatar">🙂</span>}
            </div>
            <div className="chat-meta">
              {msg.provider && msg.sender === 'ai' && (
                <span className={`provider-badge ${msg.provider}`}>{msg.provider}</span>
              )}
              <span className="chat-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble ai">
            <div className="chat-bubble-content">
              <span className="chat-avatar">{safeSpace ? '🛡️' : '🤗'}</span>
              <div className="typing-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form className="chat-input-bar" onSubmit={sendMessage}>
        <input
          className="chat-input"
          type="text"
          placeholder={safeSpace ? 'Share what\'s on your mind...' : 'Type your message...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
        <button className="chat-clear-btn" type="button" onClick={clearChat} title="Clear chat">🗑️</button>
      </form>
    </div>
  );
}

export default VentingRoom;
