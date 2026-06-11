import React from 'react';

function ChatBubble({ message, isUser = false, provider, timestamp }) {
  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const providerBadge = (p) => {
    if (!p) return '';
    const badges = {
      nvapi: 'NVIDIA',
      openai: 'OpenAI',
      gemini: 'Gemini',
      opencode: 'OpenCode',
    };
    return badges[p.toLowerCase()] || p;
  };

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
      <div className="chat-bubble-content">
        <span className="chat-avatar">{isUser ? '👤' : '🤖'}</span>
        <div>
          <div className="chat-text">{message}</div>
          <div className="chat-meta">
            <span className="chat-time">{fmtTime(timestamp)}</span>
            {provider && (
              <span className={`provider-badge ${provider.toLowerCase()}`}>
                {providerBadge(provider)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
