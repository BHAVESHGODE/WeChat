import React from 'react';

function GlassCard({ children, className = '', onClick, style, hoverable = true }) {
  return (
    <div
      className={`glass-card ${hoverable ? 'glass-card-hover' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export default GlassCard;
