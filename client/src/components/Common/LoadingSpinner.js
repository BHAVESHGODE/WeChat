import React from 'react';

function LoadingSpinner({ text = 'Loading...', size = 36 }) {
  return (
    <div className="loading-spinner-container">
      <div
        className="loading-spinner"
        style={{ width: size, height: size }}
      />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
