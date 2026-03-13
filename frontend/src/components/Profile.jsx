import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../App';

function StatusBadge({ status }) {
  const map = {
    open: { label: 'Abierto', color: '#10b981' },
    active: { label: 'Activo', color: '#f59e0b' },
    pending_review: { label: 'Revisión', color: '#3b82f6' },
    completed: { label: 'Completado', color: '#8b5cf6' },
  };
  const { label, color } = map[status] || { label: status, color: '#888' };
  return (
    <span style={{
      background: color + '22', border: `1px solid ${color}55`, color,
      borderRadius: '20px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 600,
    }}>{label}</span>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('created');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([api('/challenges'), api(`/users/${user.id}`)]).then(([all]) => {
      setChallenges(all.filter(c => c.creator_id === user.id));
      setAccepted(all.filter(c => c.accepted_by === user.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const tabs = [
    { id: 'created', label: '📋 Mis retos', count: challenges.length },
    { id: 'accepted', label: '🏆 Aceptados', count: accepted.length },
  ];

  const list = tab === 'created' ? challenges : accepted;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
      {/* User card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', gap: '1.5rem',
      }}>
        <div style={{
          width: 70, height: 70, background: 'var(--accent)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {user.username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.username}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.email}</div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>
                ${user.balance?.toFixed(2)}
              </span>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Saldo disponible</div>
            </div>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent2)' }}>{challenges.length}</span>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Retos publicados</div>
            </div>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--warning)' }}>{accepted.length}</span>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Retos aceptados</div>
            </div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} style={{
          background: 'transparent', color: 'var(--muted)', fontSize: '0.85rem',
          padding: '0.4rem 0.8rem', border: '1px solid var(--border)', borderRadius: '8px',
        }}>Salir</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.5rem 1.2rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem',
            border: '1px solid', cursor: 'pointer',
            borderColor: tab === t.id ? 'var(--accent)' : 'var(--border)',
            background: tab === t.id ? 'var(--accent)' : 'var(--surface)',
            color: tab === t.id ? '#fff' : 'var(--muted)',
          }}>
            {t.label} <span style={{ opacity: 0.7 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Cargando...</div>
      ) : list.length === 0 ? (
        <div style={{
          textAlign: 'center', color: 'var(--muted)', padding: '3rem',
          background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)',
        }}>
          {tab === 'created'
            ? <>No has publicado retos todavía. <Link to="/crear" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Crear uno</Link></>
            : 'No has aceptado ningún reto todavía.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {list.map(c => (
            <Link to={`/retos/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
                padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{c.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--success)', fontWeight: 700 }}>${c.reward_current}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>/ ${c.reward_goal}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
