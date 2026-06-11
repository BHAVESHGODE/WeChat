import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/GitHubChat.css';

const API = process.env.REACT_APP_API_URL;

function GitHubChat() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [repo, setRepo] = useState('');

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showGistModal, setShowGistModal] = useState(false);
  const [gistFiles, setGistFiles] = useState([{ filename: 'snippet.js', content: '' }]);
  const [gistDesc, setGistDesc] = useState('');
  const [gistCreating, setGistCreating] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [pinned, setPinned] = useState(new Set());

  const [aiChatMode, setAiChatMode] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const aiEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  const fetchThreads = useCallback(async () => {
    if (!repo) return;
    setLoading(true);
    try {
      const endpoint = activeTab === 'discussions' ? 'discussions' : 'issues';
      const res = await fetch(`${API}/api/chat/${endpoint}?repo=${encodeURIComponent(repo)}&state=open`);
      const data = await res.json();
      setThreads(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [repo, activeTab]);

  useEffect(() => {
    if (repo) fetchThreads();
  }, [fetchThreads, repo]);

  useEffect(() => {
    if (repo) {
      const stored = JSON.parse(localStorage.getItem('ghchat_favorites') || '[]');
      const favd = JSON.parse(localStorage.getItem('ghchat_pinned') || '[]');
      setFavorites(new Set(stored));
      setPinned(new Set(favd));
    }
  }, [repo]);

  const fetchMessages = async (thread) => {
    if (!repo || !thread?.ghNumber) return;
    setSelectedThread(thread);
    setMsgLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/messages?repo=${encodeURIComponent(repo)}&number=${thread.ghNumber}&type=${thread.type || 'issue'}`);
      const data = await res.json();
      setMessages(data.data || []);
    } catch (e) { console.error(e); }
    setMsgLoading(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    const body = replyText;
    setReplyText('');
    try {
      const res = await fetch(`${API}/api/chat/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, number: selectedThread.ghNumber, body, type: selectedThread.type || 'issue' }),
      });
      const data = await res.json();
      if (data.data) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch (e) { console.error(e); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };

  const handleCreateGist = async () => {
    const files = {};
    gistFiles.forEach((f) => { if (f.filename && f.content) files[f.filename] = f.content; });
    if (Object.keys(files).length === 0) return;
    setGistCreating(true);
    try {
      const res = await fetch(`${API}/api/chat/gist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: gistDesc || 'Shared via WeGift Chat', files }),
      });
      const data = await res.json();
      if (data.data?.htmlUrl) {
        setReplyText((prev) => prev + `\n\`\`\`\nShared gist: ${data.data.htmlUrl}\n\`\`\`\n`);
      }
      setShowGistModal(false);
      setGistFiles([{ filename: 'snippet.js', content: '' }]);
      setGistDesc('');
    } catch (e) { console.error(e); }
    setGistCreating(false);
  };

  const toggleFavorite = (threadId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId); else next.add(threadId);
      const key = repo.replace('/', '_');
      localStorage.setItem(`ghchat_favorites_${key}`, JSON.stringify([...next]));
      return next;
    });
  };

  const togglePin = (threadId) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId); else next.add(threadId);
      const key = repo.replace('/', '_');
      localStorage.setItem(`ghchat_pinned_${key}`, JSON.stringify([...next]));
      return next;
    });
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput('');
    setAiMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      const history = aiMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/api/chat/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      if (data.data) {
        setAiMessages((prev) => [...prev, data.data]);
      }
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  const sortedThreads = [...threads].sort((a, b) => {
    if (pinned.has(a.ghNodeId) && !pinned.has(b.ghNodeId)) return -1;
    if (!pinned.has(a.ghNodeId) && pinned.has(b.ghNodeId)) return 1;
    return new Date(b.lastActivity || b.updatedAt) - new Date(a.lastActivity || a.updatedAt);
  });

  const sidebarItems = [
    { id: 'discussions', label: 'Discussions', icon: '💬' },
    { id: 'issues', label: 'Issues', icon: '🔶' },
    { id: 'ai', label: 'AI Chat', icon: '🤖' },
  ];

  const renderMarkdown = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(\S[^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(\S[^*]+)\*/g, '<em>$1</em>')
      .replace(/~~(\S[^~]+)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className="ghchat">
      <nav className="ghchat-sidebar">
        <div className="ghchat-brand">
          <span className="ghchat-brand-icon">💬</span>
          <h2>GitHub Chat</h2>
        </div>
        <div className="ghchat-repo-input">
          <input type="text" placeholder="owner/repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
        </div>
        <div className="ghchat-nav">
          {sidebarItems.map((item) => (
            <button key={item.id} className={`ghchat-nav-btn ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setSelectedThread(null); }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
        <div className="ghchat-divider" />
        <div className="ghchat-section-label">Favorites</div>
        <div className="ghchat-nav">
          {threads.filter((t) => favorites.has(t.ghNodeId)).slice(0, 5).map((t) => (
            <button key={t.ghNodeId} className={`ghchat-nav-btn small ${selectedThread?.ghNodeId === t.ghNodeId ? 'active' : ''}`} onClick={() => { setSelectedThread(t); fetchMessages(t); }}>
              <span>⭐</span> {t.title?.substring(0, 25)}
            </button>
          ))}
          {[...favorites].length === 0 && <div className="ghchat-empty-hint">No favorites yet</div>}
        </div>
        <div className="ghchat-divider" />
        <div className="ghchat-section-label">Pinned</div>
        <div className="ghchat-nav">
          {threads.filter((t) => pinned.has(t.ghNodeId)).slice(0, 5).map((t) => (
            <button key={t.ghNodeId} className={`ghchat-nav-btn small ${selectedThread?.ghNodeId === t.ghNodeId ? 'active' : ''}`} onClick={() => { setSelectedThread(t); fetchMessages(t); }}>
              <span>📌</span> {t.title?.substring(0, 25)}
            </button>
          ))}
          {[...pinned].length === 0 && <div className="ghchat-empty-hint">No pinned threads</div>}
        </div>
      </nav>

      <main className="ghchat-content">
        {activeTab === 'ai' ? (
          <div className="ghchat-ai">
            <header className="ghchat-header">
              <h1 className="ghchat-title">AI Chat</h1>
              <span className="ghchat-subtitle">Chat naturally with AI</span>
            </header>
            <div className="ghchat-messages">
              {aiMessages.length === 0 ? (
                <div className="ghchat-empty">
                  <span className="ghchat-empty-icon">🤖</span>
                  <p>Say something to start a conversation!</p>
                </div>
              ) : (
                aiMessages.map((msg, i) => (
                  <div key={i} className={`ghchat-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    <div className="ghchat-msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                    <div className="ghchat-msg-bubble">
                      <div className="ghchat-msg-author">{msg.role === 'user' ? 'You' : 'AI'}</div>
                      <div className="ghchat-msg-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    </div>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="ghchat-msg ai">
                  <div className="ghchat-msg-avatar">🤖</div>
                  <div className="ghchat-msg-bubble">
                    <div className="ghchat-typing"><span className="ghchat-dot" /><span className="ghchat-dot" /><span className="ghchat-dot" /></div>
                  </div>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>
            <div className="ghchat-input-area">
              <textarea
                className="ghchat-input"
                placeholder="Type a message..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                rows={2}
              />
              <button className="ghchat-send-btn" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>Send</button>
            </div>
          </div>
        ) : (
          <>
            <header className="ghchat-header">
              <div className="ghchat-header-left">
                <h1 className="ghchat-title">{activeTab === 'discussions' ? 'Discussions' : 'Issues'} {repo && <span className="ghchat-repo-badge">{repo}</span>}</h1>
                <button className="ghchat-refresh-btn" onClick={fetchThreads} title="Refresh">↻</button>
              </div>
              <div className="ghchat-tabs">
                <button className={`ghchat-tab ${activeTab === 'discussions' ? 'active' : ''}`} onClick={() => setActiveTab('discussions')}>Discussions</button>
                <button className={`ghchat-tab ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>Issues</button>
                <button className={`ghchat-tab ${aiChatMode ? 'active' : ''}`} onClick={() => setAiChatMode(!aiChatMode)}>AI Chat</button>
              </div>
            </header>

            <div className="ghchat-body">
              <div className="ghchat-thread-list">
                {!repo ? (
                  <div className="ghchat-empty"><p>Enter a repo (owner/repo) to get started</p></div>
                ) : loading ? (
                  <div className="ghchat-loading"><div className="ghchat-spinner" /><p>Loading...</p></div>
                ) : sortedThreads.length === 0 ? (
                  <div className="ghchat-empty"><p>No threads found</p></div>
                ) : (
                  sortedThreads.map((t) => (
                    <div key={t.ghNodeId} className={`ghchat-thread-card ${selectedThread?.ghNodeId === t.ghNodeId ? 'active' : ''}`} onClick={() => fetchMessages(t)}>
                      <div className="ghchat-thread-header">
                        <span className="ghchat-thread-icon">{t.type === 'discussion' ? '💬' : '🔶'}</span>
                        <span className="ghchat-thread-state" data-state={t.state}>{t.state}</span>
                        {pinned.has(t.ghNodeId) && <span className="ghchat-pin-badge">📌</span>}
                        {favorites.has(t.ghNodeId) && <span className="ghchat-fav-badge">⭐</span>}
                      </div>
                      <div className="ghchat-thread-title">{t.title}</div>
                      <div className="ghchat-thread-meta">
                        <span>#{t.ghNumber}</span>
                        <span>by {t.author}</span>
                        <span className="ghchat-thread-actions">
                          <button className="ghchat-icon-btn" onClick={(e) => { e.stopPropagation(); togglePin(t.ghNodeId); }} title="Pin">📌</button>
                          <button className="ghchat-icon-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(t.ghNodeId); }} title="Favorite">{favorites.has(t.ghNodeId) ? '⭐' : '☆'}</button>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="ghchat-chat">
                {!selectedThread ? (
                  <div className="ghchat-empty">
                    <span className="ghchat-empty-icon">💬</span>
                    <p>Select a thread to view messages</p>
                  </div>
                ) : (
                  <>
                    <div className="ghchat-thread-detail-header">
                      <h2>{selectedThread.title}</h2>
                      <span className="ghchat-repo-badge">#{selectedThread.ghNumber}</span>
                    </div>
                    <div className="ghchat-messages">
                      {msgLoading ? (
                        <div className="ghchat-loading"><div className="ghchat-spinner" /><p>Loading messages...</p></div>
                      ) : messages.length === 0 ? (
                        <div className="ghchat-empty"><p>No messages yet</p></div>
                      ) : (
                        messages.map((msg, i) => (
                          <div key={msg.ghCommentId || i} className="ghchat-msg">
                            <div className="ghchat-msg-avatar">
                              {msg.authorAvatar ? <img src={msg.authorAvatar} alt={msg.author} /> : <span>{msg.author?.[0]?.toUpperCase()}</span>}
                            </div>
                            <div className="ghchat-msg-bubble">
                              <div className="ghchat-msg-author">{msg.author}</div>
                              <div className="ghchat-msg-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.body) }} />
                              <div className="ghchat-msg-time">{new Date(msg.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                      {aiChatMode && (
                        <div className="ghchat-ai-inline">
                          <div className="ghchat-ai-inline-input">
                            <input type="text" placeholder="Ask AI about this thread..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendAiMessage(); } }} />
                            <button onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>Ask AI</button>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="ghchat-input-area">
                      <textarea
                        className="ghchat-input"
                        placeholder="Write a reply... (Markdown supported)"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                      />
                      <div className="ghchat-input-actions">
                        <button className="ghchat-gist-btn" onClick={() => setShowGistModal(true)} title="Share code via Gist">📄 Gist</button>
                        <span className="ghchat-hint">Enter to send · Shift+Enter for new line</span>
                        <button className="ghchat-send-btn" onClick={handleReply} disabled={!replyText.trim()}>Reply</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {showGistModal && (
        <div className="ghchat-modal-overlay" onClick={() => setShowGistModal(false)}>
          <div className="ghchat-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Gist</h3>
            <input type="text" placeholder="Description (optional)" value={gistDesc} onChange={(e) => setGistDesc(e.target.value)} className="ghchat-modal-input" />
            {gistFiles.map((file, i) => (
              <div key={i} className="ghchat-gist-file">
                <input type="text" placeholder={`filename${i > 0 ? ` (${i + 1})` : ''}`} value={file.filename} onChange={(e) => { const f = [...gistFiles]; f[i].filename = e.target.value; setGistFiles(f); }} className="ghchat-modal-input" />
                <textarea placeholder="Paste code here..." value={file.content} onChange={(e) => { const f = [...gistFiles]; f[i].content = e.target.value; setGistFiles(f); }} rows={6} />
                {gistFiles.length > 1 && <button className="ghchat-modal-remove" onClick={() => setGistFiles(gistFiles.filter((_, j) => j !== i))}>Remove</button>}
              </div>
            ))}
            <div className="ghchat-modal-actions">
              <button className="ghchat-modal-btn secondary" onClick={() => setGistFiles([...gistFiles, { filename: '', content: '' }])}>+ Add file</button>
              <div>
                <button className="ghchat-modal-btn" onClick={() => setShowGistModal(false)}>Cancel</button>
                <button className="ghchat-modal-btn primary" onClick={handleCreateGist} disabled={gistCreating}>{gistCreating ? 'Creating...' : 'Create Gist'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GitHubChat;
