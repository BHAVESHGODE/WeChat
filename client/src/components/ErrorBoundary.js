import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)',
        }}>
          <span style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>⚡</span>
          <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.5)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.5rem', border: 'none', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c4dff, #43e97b)', color: '#fff',
              fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
