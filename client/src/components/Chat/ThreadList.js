import React from 'react';

function ThreadList({ threads, activeId, onSelect, type = 'discussion', loading }) {
  if (loading) return <div className="loading-spinner" style={{ margin: '2rem auto' }} />;

  if (!threads?.length) {
    return <div className="empty-state"><p>No {type}s found</p></div>;
  }

  return (
    <div className="thread-list">
      {threads.map((thread) => {
        const id = thread._id || thread.ghNodeId || thread.id;
        const isActive = id === activeId;
        return (
          <div
            key={id}
            className={`thread-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(thread)}
          >
            <div className="thread-header">
              <span className="thread-type-badge">
                {type === 'issue' ? '🐛' : '💬'}
              </span>
              <span className={`thread-state ${thread.state}`}>
                {thread.state || 'open'}
              </span>
            </div>
            <h4 className="thread-title">{thread.title}</h4>
            <div className="thread-meta">
              <span>#{thread.ghNumber || thread.number}</span>
              {thread.repo && <span>{thread.repo}</span>}
              <span>{thread.labels?.length || 0} labels</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ThreadList;
