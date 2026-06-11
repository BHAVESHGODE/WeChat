import React, { useMemo } from 'react';

function MarkdownRenderer({ content }) {
  const html = useMemo(() => {
    if (!content) return '';
    let result = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/# (.+)/g, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    return `<p>${result}</p>`;
  }, [content]);

  return (
    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default MarkdownRenderer;
