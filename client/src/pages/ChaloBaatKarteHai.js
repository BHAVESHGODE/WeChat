import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ChaloBaatKarteHai.css';
import '../styles/GitHubChat.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LANG_MAP = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', go: 'golang', rs: 'rust',
  sh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml',
  json: 'json', xml: 'xml', html: 'html', css: 'css',
  sql: 'sql', md: 'markdown',
};

// Unified Markdown & Code Syntax Highlighter
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Fenced code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const label = LANG_MAP[lang] || lang || 'code';
    const langLabel = lang ? `<span class="cbkh-code-lang">${label}</span>` : '';
    return `<div class="cbkh-code-block">${langLabel}<pre><code>${code.trim()}</code></pre></div>`;
  });
  
  // Inline code, bold, italics, strikes, links
  html = html
    .replace(/`([^`]+)`/g, '<code class="cbkh-inline-code">$1</code>')
    .replace(/\*\*(\S[^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(\S[^*\n]+)\*/g, '<em>$1</em>')
    .replace(/~~(\S[^~\n]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\n/g, '<br/>');
  return html;
}

function ChaloBaatKarteHai() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?._id || user?.email || 'guest';

  // Navigation tabs: 'ai', 'discussions', 'issues'
  const [activeTab, setActiveTab] = useState('ai');
  const [repo, setRepo] = useState('');

  // Primary AI Chat states
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [enableThinking, setEnableThinking] = useState(false);
  const [nvidiaTask, setNvidiaTask] = useState(null);
  const [nvidiaLoading, setNvidiaLoading] = useState(false);

  // GitHub threads states
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [pinned, setPinned] = useState(new Set());

  // Gist modal states
  const [showGistModal, setShowGistModal] = useState(false);
  const [gistFiles, setGistFiles] = useState([{ filename: 'snippet.js', content: '' }]);
  const [gistDesc, setGistDesc] = useState('');
  const [gistCreating, setGistCreating] = useState(false);

  // Inline AI Chat modes for GitHub Threads
  const [aiChatMode, setAiChatMode] = useState(false);
  const [inlineAiMessages, setInlineAiMessages] = useState([]);
  const [inlineAiInput, setInlineAiInput] = useState('');
  const [inlineAiLoading, setInlineAiLoading] = useState(false);

  // Scroll references
  const mainChatEndRef = useRef(null);
  const githubMessagesEndRef = useRef(null);

  // Auto Scroll
  useEffect(() => {
    mainChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading, nvidiaLoading]);

  useEffect(() => {
    githubMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, msgLoading, inlineAiMessages]);

  // Load Primary AI Chat History
  useEffect(() => {
    if (!userId || activeTab !== 'ai') return;
    const loadConversation = async () => {
      try {
        const res = await fetch(`${API}/api/conversation/${userId}`);
        const data = await res.json();
        if (data.messages) {
          setAiMessages(data.messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
            provider: m.provider,
            timestamp: m.timestamp,
          })));
        }
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    };
    loadConversation();
  }, [userId, activeTab]);

  // Load Favorites & Pinned from Local Storage per repo
  useEffect(() => {
    if (repo && (activeTab === 'discussions' || activeTab === 'issues')) {
      const key = repo.replace('/', '_');
      const stored = JSON.parse(localStorage.getItem(`ghchat_favorites_${key}`) || '[]');
      const favd = JSON.parse(localStorage.getItem(`ghchat_pinned_${key}`) || '[]');
      setFavorites(new Set(stored));
      setPinned(new Set(favd));
    }
  }, [repo, activeTab]);

  // Fetch discussions / issues from GitHub API
  const fetchThreads = useCallback(async () => {
    if (!repo) return;
    setLoading(true);
    try {
      const endpoint = activeTab === 'discussions' ? 'discussions' : 'issues';
      const res = await fetch(`${API}/api/chat/${endpoint}?repo=${encodeURIComponent(repo)}&state=open`);
      const data = await res.json();
      setThreads(data.data || []);
    } catch (e) {
      console.error('Fetch threads failed:', e);
    } finally {
      setLoading(false);
    }
  }, [repo, activeTab]);

  // Fetch threads when repo or tab changes
  useEffect(() => {
    if (repo && (activeTab === 'discussions' || activeTab === 'issues')) {
      fetchThreads();
    }
  }, [fetchThreads, repo, activeTab]);

  // Fetch comments/messages of a GitHub thread
  const fetchMessages = async (thread) => {
    if (!repo || !thread?.ghNumber) return;
    setSelectedThread(thread);
    setMsgLoading(true);
    setInlineAiMessages([]); // Clear inline AI context
    setAiChatMode(false);
    try {
      const res = await fetch(`${API}/api/chat/messages?repo=${encodeURIComponent(repo)}&number=${thread.ghNumber}&type=${thread.type || 'issue'}`);
      const data = await res.json();
      setMessages(data.data || []);
    } catch (e) {
      console.error('Fetch thread comments failed:', e);
    } finally {
      setMsgLoading(false);
    }
  };

  // Reply to GitHub thread
  const handleReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    const body = replyText;
    setReplyText('');
    try {
      const res = await fetch(`${API}/api/chat/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          number: selectedThread.ghNumber,
          body,
          type: selectedThread.type || 'issue'
        }),
      });
      const data = await res.json();
      if (data.data) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch (e) {
      console.error('Post comment failed:', e);
    }
  };

  // Send message in Primary AI Chat
  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const text = aiInput;
    setAiInput('');
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/ai/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: aiMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          enableThinking,
          provider: selectedProvider === 'auto' ? undefined : selectedProvider,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setAiMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.data.content,
          provider: data.data.provider,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (e) {
      setAiMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, the AI model is currently offline. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Send message in GitHub inline AI Chat
  const sendInlineAiMessage = async () => {
    if (!inlineAiInput.trim() || inlineAiLoading) return;
    const text = inlineAiInput;
    setInlineAiInput('');
    setInlineAiMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInlineAiLoading(true);
    try {
      const history = inlineAiMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/api/chat/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (data.data) {
        setInlineAiMessages((prev) => [...prev, data.data]);
      }
    } catch (e) {
      console.error('Inline AI failed:', e);
    } finally {
      setInlineAiLoading(false);
    }
  };

  // Run NVIDIA Analysis tasks
  const runNvidiaTask = async (task) => {
    const content = aiMessages.filter((m) => m.role === 'user').slice(-3).map((m) => m.content).join('\n');
    if (!content && task !== 'chat') return;
    setNvidiaTask(task);
    setNvidiaLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          content,
          context: aiMessages.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')
        }),
      });
      const data = await res.json();
      if (data.data) {
        setAiMessages((prev) => [...prev, {
          role: 'assistant',
          content: `**NVIDIA ${task.toUpperCase()}:**\n${data.data.result}`,
          provider: 'nvapi',
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (e) {
      console.error('NVIDIA task error:', e);
    } finally {
      setNvidiaLoading(false);
    }
  };

  // Create GitHub Gist
  const handleCreateGist = async () => {
    const files = {};
    gistFiles.forEach((f) => {
      if (f.filename && f.content) files[f.filename] = f.content;
    });
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
        setReplyText((prev) => prev + `\n\`\`\`\nShared Gist: ${data.data.htmlUrl}\n\`\`\`\n`);
      }
      setShowGistModal(false);
      setGistFiles([{ filename: 'snippet.js', content: '' }]);
      setGistDesc('');
    } catch (e) {
      console.error('Gist creation failed:', e);
    } finally {
      setGistCreating(false);
    }
  };

  // Toggle Pinned
  const togglePin = (threadId) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId); else next.add(threadId);
      const key = repo.replace('/', '_');
      localStorage.setItem(`ghchat_pinned_${key}`, JSON.stringify([...next]));
      return next;
    });
  };

  // Toggle Favorite
  const toggleFavorite = (threadId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId); else next.add(threadId);
      const key = repo.replace('/', '_');
      localStorage.setItem(`ghchat_favorites_${key}`, JSON.stringify([...next]));
      return next;
    });
  };

  const clearAiChat = async () => {
    if (!window.confirm('Clear all conversation history?')) return;
    try {
      await fetch(`${API}/api/conversation/${userId}`, { method: 'DELETE' });
      setAiMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const sortedThreads = [...threads].sort((a, b) => {
    if (pinned.has(a.ghNodeId) && !pinned.has(b.ghNodeId)) return -1;
    if (!pinned.has(a.ghNodeId) && pinned.has(b.ghNodeId)) return 1;
    return new Date(b.lastActivity || b.updatedAt) - new Date(a.lastActivity || a.updatedAt);
  });

  return (
    <div className="cbkh ghchat">
      {/* Sidebar Navigation */}
      <nav className="ghchat-sidebar">
        <div className="ghchat-brand">
          <span className="ghchat-brand-icon">⚡</span>
          <h2>Chat Hub</h2>
        </div>

        <div className="ghchat-nav">
          <button
            className={`ghchat-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai'); setSelectedThread(null); }}
          >
            <span>🤖</span> AI Friend Chat
          </button>
          <button
            className={`ghchat-nav-btn ${activeTab === 'discussions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('discussions'); setSelectedThread(null); }}
          >
            <span>💬</span> GitHub Discussions
          </button>
          <button
            className={`ghchat-nav-btn ${activeTab === 'issues' ? 'active' : ''}`}
            onClick={() => { setActiveTab('issues'); setSelectedThread(null); }}
          >
            <span>🔶</span> GitHub Issues
          </button>
        </div>

        {activeTab !== 'ai' && (
          <div className="ghchat-repo-input">
            <span className="cbkh-repo-label">Configuration</span>
            <input
              type="text"
              placeholder="owner/repo (e.g. facebook/react)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="cbkh-repo-textbox"
            />
          </div>
        )}

        {repo && activeTab !== 'ai' && (
          <>
            <div className="ghchat-divider" />
            <div className="ghchat-section-label">Favorites</div>
            <div className="ghchat-nav">
              {threads.filter((t) => favorites.has(t.ghNodeId)).slice(0, 5).map((t) => (
                <button
                  key={t.ghNodeId}
                  className={`ghchat-nav-btn small ${selectedThread?.ghNodeId === t.ghNodeId ? 'active' : ''}`}
                  onClick={() => { setSelectedThread(t); fetchMessages(t); }}
                >
                  <span>⭐</span> {t.title?.substring(0, 20)}...
                </button>
              ))}
              {[...favorites].length === 0 && <div className="ghchat-empty-hint">No favorites yet</div>}
            </div>

            <div className="ghchat-divider" />
            <div className="ghchat-section-label">Pinned</div>
            <div className="ghchat-nav">
              {threads.filter((t) => pinned.has(t.ghNodeId)).slice(0, 5).map((t) => (
                <button
                  key={t.ghNodeId}
                  className={`ghchat-nav-btn small ${selectedThread?.ghNodeId === t.ghNodeId ? 'active' : ''}`}
                  onClick={() => { setSelectedThread(t); fetchMessages(t); }}
                >
                  <span>📌</span> {t.title?.substring(0, 20)}...
                </button>
              ))}
              {[...pinned].length === 0 && <div className="ghchat-empty-hint">No pinned threads</div>}
            </div>
          </>
        )}

        <div className="cbkh-sidebar-footer">
          <button className="cbkh-clear-btn" onClick={() => navigate(`/${user?.name?.toLowerCase() || 'maverick'}`)}>
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="ghchat-content">
        {activeTab === 'ai' ? (
          // Advanced AI chat viewport from ChaloBaatKarteHai.js
          <div className="cbkh-ai">
            <header className="cbkh-header">
              <div className="cbkh-header-left">
                <h1 className="cbkh-title">Chalo Baat Karte Hai</h1>
                <select className="cbkh-provider-select" value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
                  <option value="auto">Auto (Llama 3.1)</option>
                  <option value="nvapi">NVIDIA (Primary)</option>
                </select>
                {aiMessages.length > 0 && (
                  <span className="cbkh-msg-count">{aiMessages.length} messages</span>
                )}
              </div>
              <div className="cbkh-header-actions">
                <label className="cbkh-toggle-label">
                  <input type="checkbox" checked={enableThinking} onChange={(e) => setEnableThinking(e.target.checked)} />
                  <span>Thinking Mode</span>
                </label>
                {aiMessages.length > 0 && (
                  <button className="cbkh-clear-btn" onClick={clearAiChat} title="Clear conversation">Clear</button>
                )}
              </div>
            </header>

            <div className="cbkh-messages">
              {aiMessages.length === 0 ? (
                <div className="cbkh-empty">
                  <span className="cbkh-empty-icon">💬</span>
                  <h2>AI Friend Chat</h2>
                  <p>Say hello to start a conversation! Ask a question or share how your day is going.</p>
                  <p className="cbkh-empty-hint">Powered by Llama 3.1 & NVIDIA NIM APIs</p>
                  <div className="cbkh-nvidia-tools" style={{ marginTop: '1rem' }}>
                    <button className="cbkh-task-btn" onClick={() => {
                      setAiMessages([{ role: 'assistant', content: 'Hi! I\'m your AI assistant. How can I help you today?', provider: 'nvapi', timestamp: new Date().toISOString() }]);
                    }}>👋 Quick Greeting</button>
                  </div>
                </div>
              ) : (
                aiMessages.map((msg, i) => (
                  <div key={i} className={`cbkh-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    <div className="cbkh-msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                    <div className="cbkh-msg-bubble">
                      <div className="cbkh-msg-author">{msg.role === 'user' ? 'You' : 'AI Assistant'}</div>
                      <div className="cbkh-msg-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      <div className="cbkh-msg-meta">
                        {msg.provider && msg.role === 'assistant' && (
                          <span className={`cbkh-provider-badge ${msg.provider}`}>{msg.provider.toUpperCase()}</span>
                        )}
                        {msg.timestamp && (
                          <span className="cbkh-msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {nvidiaLoading && (
                <div className="cbkh-msg ai">
                  <div className="cbkh-msg-avatar">🤖</div>
                  <div className="cbkh-msg-bubble">
                    <div className="cbkh-msg-author">NVIDIA {nvidiaTask?.toUpperCase()}</div>
                    <div className="cbkh-typing"><span className="cbkh-dot" /><span className="cbkh-dot" /><span className="cbkh-dot" /></div>
                  </div>
                </div>
              )}

              {aiLoading && (
                <div className="cbkh-msg ai">
                  <div className="cbkh-msg-avatar">🤖</div>
                  <div className="cbkh-msg-bubble">
                    <div className="cbkh-typing"><span className="cbkh-dot" /><span className="cbkh-dot" /><span className="cbkh-dot" /></div>
                  </div>
                </div>
              )}
              <div ref={mainChatEndRef} />
            </div>

            <div className="cbkh-nvidia-toolbar">
              <button className="cbkh-task-btn" onClick={() => runNvidiaTask('summarize')} disabled={nvidiaLoading || aiMessages.length === 0} title="Summarize conversation">
                📝 Summarize
              </button>
              <button className="cbkh-task-btn" onClick={() => runNvidiaTask('explain')} disabled={nvidiaLoading || aiMessages.length === 0} title="Explain main topic">
                🔍 Explain
              </button>
              <button className="cbkh-task-btn" onClick={() => runNvidiaTask('analyze')} disabled={nvidiaLoading || aiMessages.length === 0} title="Analyze sentiment">
                📊 Analyze
              </button>
            </div>

            <div className="cbkh-input-area">
              <textarea
                className="cbkh-input"
                placeholder="Talk to your AI friend... (Press Enter to Send)"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAiMessage();
                  }
                }}
                rows={2}
                disabled={aiLoading}
              />
              <button className="cbkh-send-btn" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>Send</button>
            </div>
          </div>
        ) : (
          // GitHub discussions/issues layout from GitHubChat.js
          <div className="cbkh-github-layout" style={{ display: 'flex', height: '100%', width: '100%' }}>
            <div className="ghchat-thread-list" style={{ width: '320px', borderRight: '1px dashed var(--cbkh-border)' }}>
              {!repo ? (
                <div className="cbkh-empty" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>Configure a GitHub owner/repo in the sidebar to get started.</p>
                </div>
              ) : loading ? (
                <div className="cbkh-loading">
                  <div className="cbkh-spinner" />
                  <p>Streaming thread records...</p>
                </div>
              ) : sortedThreads.length === 0 ? (
                <div className="cbkh-empty">
                  <p>No open threads found.</p>
                </div>
              ) : (
                <div className="ghchat-threads-scroll" style={{ overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
                  {sortedThreads.map((t) => (
                    <div
                      key={t.ghNodeId}
                      className={`ghchat-thread-card ${selectedThread?.ghNodeId === t.ghNodeId ? 'active' : ''}`}
                      onClick={() => fetchMessages(t)}
                    >
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
                        <div className="ghchat-thread-actions">
                          <button className="ghchat-icon-btn" onClick={(e) => { e.stopPropagation(); togglePin(t.ghNodeId); }} title="Pin">📌</button>
                          <button className="ghchat-icon-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(t.ghNodeId); }} title="Favorite">{favorites.has(t.ghNodeId) ? '⭐' : '☆'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ghchat-chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {!selectedThread ? (
                <div className="cbkh-empty">
                  <span className="cbkh-empty-icon">💬</span>
                  <h2>GitHub Chat Pane</h2>
                  <p>Select an issue or discussion from the left column to view conversation files and write replies.</p>
                </div>
              ) : (
                <>
                  <header className="cbkh-header">
                    <div className="cbkh-header-left">
                      <h1 className="cbkh-title">{selectedThread.title}</h1>
                      <span className="cbkh-msg-count">#{selectedThread.ghNumber}</span>
                    </div>
                    <div className="cbkh-header-actions">
                      <button
                        className={`cbkh-toggle-label ${aiChatMode ? 'active' : ''}`}
                        onClick={() => setAiChatMode(!aiChatMode)}
                        style={{ background: 'transparent', border: '1px solid var(--cbkh-border)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}
                      >
                        🤖 {aiChatMode ? 'Hide Thread AI' : 'Ask Thread AI'}
                      </button>
                      <button className="cbkh-provider-select" onClick={fetchThreads} title="Refresh thread comments">↻ Refresh</button>
                    </div>
                  </header>

                  <div className="cbkh-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {msgLoading ? (
                      <div className="cbkh-loading">
                        <div className="cbkh-spinner" />
                        <p>Fetching thread comments...</p>
                      </div>
                    ) : (
                      <>
                        {/* Original Thread Opener Body */}
                        {selectedThread.body && (
                          <div className="ghchat-msg opener" style={{ borderBottom: '1px dashed var(--cbkh-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div className="cbkh-msg-avatar">👤</div>
                            <div className="cbkh-msg-bubble" style={{ borderLeft: '3px solid var(--cbkh-accent-amber)' }}>
                              <div className="cbkh-msg-author">{selectedThread.author} (Opener)</div>
                              <div className="cbkh-msg-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedThread.body) }} />
                            </div>
                          </div>
                        )}

                        {/* Thread Comments */}
                        {messages.length === 0 ? (
                          <div className="cbkh-empty" style={{ minHeight: '100px' }}>
                            <p>No replies in this thread yet. Write the first response below!</p>
                          </div>
                        ) : (
                          messages.map((msg, i) => (
                            <div key={msg.ghCommentId || i} className="cbkh-msg">
                              <div className="cbkh-msg-avatar">
                                {msg.authorAvatar ? <img src={msg.authorAvatar} alt={msg.author} className="cbkh-avatar-img" style={{ width: '100%', height: '100%', borderRadius: '4px' }} /> : <span>{msg.author?.[0]?.toUpperCase()}</span>}
                              </div>
                              <div className="cbkh-msg-bubble">
                                <div className="cbkh-msg-author">{msg.author}</div>
                                <div className="cbkh-msg-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.body) }} />
                                <div className="cbkh-msg-meta">
                                  <span className="cbkh-msg-time">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}

                    {/* Inline Thread AI chat box */}
                    {aiChatMode && (
                      <div className="cbkh-inline-ai-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--cbkh-border)', borderRadius: '4px', background: 'rgba(0,0,0,0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed var(--cbkh-border)', paddingBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--cbkh-accent-cyan)' }}>🤖 Thread Discussion AI</span>
                          {inlineAiLoading && <span className="cbkh-dot-blink" style={{ fontSize: '0.75rem', color: 'var(--cbkh-accent-green)' }}>Thinking...</span>}
                        </div>
                        
                        <div className="cbkh-inline-ai-messages" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                          {inlineAiMessages.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--cbkh-text-dim)' }}>Ask the AI assistant any questions regarding this thread context.</p>}
                          {inlineAiMessages.map((aimsg, index) => (
                            <div key={index} className={`cbkh-msg ${aimsg.role === 'user' ? 'user' : 'ai'}`}>
                              <div className="cbkh-msg-avatar">{aimsg.role === 'user' ? '👤' : '🤖'}</div>
                              <div className="cbkh-msg-bubble" style={aimsg.role === 'user' ? { borderRight: '3px solid var(--cbkh-accent-purple)' } : { borderLeft: '3px solid var(--cbkh-accent-cyan)' }}>
                                <div className="cbkh-msg-author">{aimsg.role === 'user' ? 'You' : 'AI'}</div>
                                <div className="cbkh-msg-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(aimsg.content) }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="cbkh-input-area" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                          <input
                            type="text"
                            placeholder="Type question about thread..."
                            value={inlineAiInput}
                            onChange={(e) => setInlineAiInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                sendInlineAiMessage();
                              }
                            }}
                            className="cbkh-input"
                            style={{ minHeight: '38px', padding: '0.5rem 0.8rem' }}
                          />
                          <button
                            className="cbkh-send-btn"
                            onClick={sendInlineAiMessage}
                            disabled={inlineAiLoading || !inlineAiInput.trim()}
                            style={{ height: '38px', padding: '0 1rem' }}
                          >
                            Ask
                          </button>
                        </div>
                      </div>
                    )}
                    <div ref={githubMessagesEndRef} />
                  </div>

                  <div className="cbkh-input-area">
                    <textarea
                      className="cbkh-input"
                      placeholder="Write a reply to this thread... (Markdown supported)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                      rows={2}
                    />
                    <div className="ghchat-input-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '0.5rem' }}>
                      <button className="cbkh-clear-btn" onClick={() => setShowGistModal(true)} title="Share code via Gist">📄 Share Gist</button>
                      <span className="cbkh-empty-hint" style={{ fontSize: '0.65rem' }}>Enter to Send · Shift+Enter for new line</span>
                      <button className="cbkh-send-btn" onClick={handleReply} disabled={!replyText.trim()} style={{ height: '38px' }}>Reply</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Gist Modal */}
      {showGistModal && (
        <div className="ghchat-modal-overlay" onClick={() => setShowGistModal(false)} style={{ zIndex: 100 }}>
          <div className="ghchat-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--cbkh-bg)', border: '1px solid var(--cbkh-border)' }}>
            <h3>Create Gist</h3>
            <input
              type="text"
              placeholder="Description (optional)"
              value={gistDesc}
              onChange={(e) => setGistDesc(e.target.value)}
              className="ghchat-modal-input"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--cbkh-border)', color: '#fff' }}
            />
            {gistFiles.map((file, i) => (
              <div key={i} className="ghchat-gist-file">
                <input
                  type="text"
                  placeholder={`filename${i > 0 ? ` (${i + 1})` : ''}`}
                  value={file.filename}
                  onChange={(e) => {
                    const f = [...gistFiles];
                    f[i].filename = e.target.value;
                    setGistFiles(f);
                  }}
                  className="ghchat-modal-input"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--cbkh-border)', color: '#fff', marginBottom: '0.5rem' }}
                />
                <textarea
                  placeholder="Paste code here..."
                  value={file.content}
                  onChange={(e) => {
                    const f = [...gistFiles];
                    f[i].content = e.target.value;
                    setGistFiles(f);
                  }}
                  rows={4}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--cbkh-border)', color: '#fff', width: '100%', boxSizing: 'border-box', padding: '0.5rem' }}
                />
                {gistFiles.length > 1 && (
                  <button className="cbkh-clear-btn" onClick={() => setGistFiles(gistFiles.filter((_, j) => j !== i))} style={{ marginTop: '0.5rem' }}>
                    Remove File
                  </button>
                )}
              </div>
            ))}
            <div className="ghchat-modal-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="cbkh-clear-btn" onClick={() => setGistFiles([...gistFiles, { filename: '', content: '' }])}>+ Add file</button>
              <div>
                <button className="cbkh-clear-btn" onClick={() => setShowGistModal(false)} style={{ marginRight: '0.5rem' }}>Cancel</button>
                <button className="cbkh-send-btn" onClick={handleCreateGist} disabled={gistCreating} style={{ height: '34px' }}>
                  {gistCreating ? 'Creating...' : 'Create Gist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChaloBaatKarteHai;
