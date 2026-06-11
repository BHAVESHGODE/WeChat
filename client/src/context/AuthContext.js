import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL;
const AuthContext = createContext();

const DEMO_USERS = {
  maverick: { _id: 'demo-maverick', name: 'Maverick', email: 'maverick@wegift.demo', role: 'pioneer' },
  bell: { _id: 'demo-bell', name: 'Bell', email: 'bell@wegift.demo', role: 'strategist' },
  goju: { _id: 'demo-goju', name: 'Goju', email: 'goju@wegift.demo', role: 'guardian' },
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('wegift_demo_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('wegift_token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const loginAsDemo = useCallback((name) => {
    const key = name.toLowerCase();
    const demoUser = DEMO_USERS[key] || DEMO_USERS.maverick;
    localStorage.setItem('wegift_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  }, []);

  const logoutDemo = useCallback(() => {
    localStorage.removeItem('wegift_demo_user');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token && !user) {
      setLoading(false);
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    let cleanup = false;
    import('socket.io-client').then(({ default: io }) => {
      if (cleanup) return;
      try {
        const s = io(API, { transports: ['websocket', 'polling'], timeout: 5000 });
        s.on('connect', () => {
          if (user?._id) s.emit('join', user._id);
        });
        s.on('notification', (msg) => {
          if (msg.type === 'task_reminder') {
            try {
              const { toast } = require('react-toastify');
              toast.info(`⏰ ${msg.text}`, { autoClose: 10000 });
            } catch (e) { /* ignore */ }
          }
        });
        setSocket(s);
      } catch (e) { /* ignore */ }
    });
    return () => { cleanup = true; if (socket) socket.disconnect(); };
  }, [token, user?._id]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Invalid token');
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('wegift_token');
        setToken(null);
        setLoading(false);
      });
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('wegift_token', data.token);
    localStorage.removeItem('wegift_demo_user');
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('wegift_token', data.token);
    localStorage.removeItem('wegift_demo_user');
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wegift_token');
    localStorage.removeItem('wegift_demo_user');
    if (socket) { try { socket.disconnect(); } catch (e) { /* */ } }
    setToken(null);
    setUser(null);
    setSocket(null);
  }, [socket]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, socket, loginAsDemo, logoutDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { AuthProvider, useAuth };
