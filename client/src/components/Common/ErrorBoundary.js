import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b9d' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem', padding: '0.6rem 1.5rem', borderRadius: '999px',
              border: 'none', background: 'linear-gradient(135deg, #7c4dff, #43e97b)',
              color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
