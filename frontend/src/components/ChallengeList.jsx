import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../App';

const CATEGORIES = ['Todos', 'general', 'deportes', 'humor', 'talento', 'social', 'gaming', 'otro'];
const STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'open', label: 'Abiertos' },
  { value: 'active', label: 'En progreso' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'completed', label: 'Completados' },
];

function StatusBadge({ status }) {
  const map = {
    open: { label: 'Abierto', color: '#10b981' },
    active: { label: 'En progreso', color: '#f59e0b' },
    pending_review: { label: 'En revisión', color: '#3b82f6' },
    completed: { label: 'Completado', color: '#8b5cf6' },
  };
  const { label, color } = map[status] || { label: status, color: '#888' };
  return (
    <span style={{
      background: color + '22', border: `1px solid ${color}55`, color,
      borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600,
    }}>{label}</span>
  );
}

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/challenges?';
      if (status) url += `status=${status}&`;
      if (category && category !== 'Todos') url += `category=${category}&`;
      const data = await api(url);
      setChallenges(data);
    } catch {}
    setLoading(false);
  }, [status, category]);

  useEffect(() => { load(); }, [load]);

  const filtered = challenges.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>🎯 Retos</h1>
        <p style={{ color: 'var(--muted)' }}>Encuentra un reto que te anime a hacer algo increíble.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar retos..."
          style={{
            flex: 1, minWidth: 200,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            color: 'var(--text)',
            fontSize: '0.9rem',
          }}
        />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
          padding: '0.6rem 0.8rem', color: 'var(--text)', fontSize: '0.9rem',
        }}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat === 'Todos' ? '' : cat)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: (category === (cat === 'Todos' ? '' : cat)) ? 'var(--accent)' : 'var(--border)',
              background: (category === (cat === 'Todos' ? '' : cat)) ? 'var(--accent)' : 'var(--surface)',
              color: (category === (cat === 'Todos' ? '' : cat)) ? '#fff' : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >{cat}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>Cargando retos...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', color: 'var(--muted)', padding: '4rem',
          background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏜️</div>
          <div style={{ fontWeight: 600 }}>No hay retos aquí todavía</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>¡Sé el primero en publicar uno!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(c => {
            const pct = Math.min(100, (c.reward_current / c.reward_goal) * 100);
            return (
              <Link to={`/retos/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  height: '100%',
                  transition: 'border-color 0.2s, transform 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', alignItems: 'flex-start' }}>
                    <StatusBadge status={c.status} />
                    <span style={{
                      background: 'var(--surface2)', borderRadius: '20px',
                      padding: '0.15rem 0.6rem', fontSize: '0.75rem', color: 'var(--muted)',
                    }}>{c.category}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{c.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                    {c.description.slice(0, 90)}{c.description.length > 90 ? '…' : ''}
                  </div>
                  <div style={{ marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fondos recaudados</span><span>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>${c.reward_current}</span>
                    <span style={{ color: 'var(--muted)' }}>/ ${c.reward_goal}</span>
                  </div>
                  <div style={{ marginTop: '0.8rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    por <strong style={{ color: 'var(--text)' }}>{c.creator_name}</strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
