import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import ChallengeList from './components/ChallengeList';
import ChallengeDetail from './components/ChallengeDetail';
import CreateChallenge from './components/CreateChallenge';
import Profile from './components/Profile';
import Login from './components/Login';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API = '/api';
export const api = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
};

function Navbar({ user, onLogout }) {
  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🎯</span>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent2)' }}>RetosApp</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/retos" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Explorar</Link>
        {user ? (
          <>
            <Link to="/crear" style={{
              background: 'var(--accent)',
              color: '#fff',
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>+ Crear Reto</Link>
            <Link to="/perfil" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text)',
              fontSize: '0.9rem',
            }}>
              <span style={{
                width: 30, height: 30,
                background: 'var(--accent)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem',
              }}>
                {user.username[0].toUpperCase()}
              </span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                ${user.balance?.toFixed(2)}
              </span>
            </Link>
            <button onClick={onLogout} style={{
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: '0.85rem',
              padding: '0.3rem 0.6rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}>Salir</button>
          </>
        ) : (
          <Link to="/login" style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>Ingresar</Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('retos_user')); } catch { return null; }
  });

  const login = (u) => {
    setUser(u);
    localStorage.setItem('retos_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('retos_user');
  };

  // Refresh user balance periodically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await api(`/users/${user.id}`);
        setUser(prev => ({ ...prev, balance: fresh.balance }));
        localStorage.setItem('retos_user', JSON.stringify({ ...user, balance: fresh.balance }));
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Navbar user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/retos" element={<ChallengeList />} />
          <Route path="/retos/:id" element={<ChallengeDetail />} />
          <Route path="/crear" element={<CreateChallenge />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
