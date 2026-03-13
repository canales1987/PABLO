import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../App';

const s = {
  hero: {
    textAlign: 'center',
    padding: '5rem 2rem 3rem',
    background: 'radial-gradient(ellipse at top, #7c3aed22 0%, transparent 60%)',
  },
  badge: {
    display: 'inline-block',
    background: '#7c3aed22',
    border: '1px solid #7c3aed55',
    color: 'var(--accent2)',
    borderRadius: '20px',
    padding: '0.3rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  h1: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: '1rem',
  },
  gradient: {
    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '1.1rem',
    maxWidth: '520px',
    margin: '0 auto 2.5rem',
  },
  ctaGroup: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  ctaPrimary: {
    background: 'var(--accent)',
    color: '#fff',
    padding: '0.9rem 2rem',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    display: 'inline-block',
    transition: 'transform 0.15s',
  },
  ctaSecondary: {
    background: 'var(--surface)',
    color: 'var(--text)',
    padding: '0.9rem 2rem',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '1rem',
    border: '1px solid var(--border)',
    display: 'inline-block',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    padding: '2.5rem 2rem',
    flexWrap: 'wrap',
  },
  statItem: { textAlign: 'center' },
  statNum: { fontSize: '2rem', fontWeight: 800, color: 'var(--accent2)' },
  statLabel: { color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' },
  section: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  sectionTitle: { fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.2rem',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
  },
  cardTitle: { fontWeight: 700, marginBottom: '0.4rem', fontSize: '1rem' },
  cardDesc: { color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 },
  progressBar: {
    background: 'var(--surface2)',
    borderRadius: '4px',
    height: '6px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  howStep: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.2rem',
  },
  stepNum: {
    width: 36, height: 36, minWidth: 36,
    background: 'var(--accent)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '0.9rem',
  },
};

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
      background: color + '22',
      border: `1px solid ${color}55`,
      color,
      borderRadius: '20px',
      padding: '0.15rem 0.6rem',
      fontSize: '0.75rem',
      fontWeight: 600,
    }}>{label}</span>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, totalRewards: 0, active: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api('/stats').then(setStats).catch(() => {});
    api('/challenges?status=open').then(d => setRecent(d.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      <div style={s.hero}>
        <div style={s.badge}>🔥 La plataforma de retos con recompensas reales</div>
        <h1 style={s.h1}>
          ¿Tienes el valor de<br />
          <span style={s.gradient}>aceptar el reto?</span>
        </h1>
        <p style={s.subtitle}>
          Publica tus retos, establece la recompensa que aceptarías,
          y cuando lo logres súbelo para ganar.
        </p>
        <div style={s.ctaGroup}>
          <Link to={user ? '/crear' : '/login'} style={s.ctaPrimary}>
            🎯 Crear un reto
          </Link>
          <Link to="/retos" style={s.ctaSecondary}>
            Explorar retos
          </Link>
        </div>
      </div>

      <div style={s.stats}>
        {[
          { num: stats.total, label: 'Retos publicados' },
          { num: stats.active, label: 'Retos activos' },
          { num: stats.completed, label: 'Completados' },
          { num: `$${stats.totalRewards?.toFixed(0) || 0}`, label: 'En recompensas' },
        ].map(({ num, label }) => (
          <div key={label} style={s.statItem}>
            <div style={s.statNum}>{num}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>🔥 Retos recientes</div>
          <div style={s.grid}>
            {recent.map(c => {
              const pct = Math.min(100, (c.reward_current / c.reward_goal) * 100);
              return (
                <Link to={`/retos/${c.id}`} key={c.id} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <StatusBadge status={c.status} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{c.category}</span>
                    </div>
                    <div style={s.cardTitle}>{c.title}</div>
                    <div style={s.cardDesc}>{c.description.slice(0, 100)}{c.description.length > 100 ? '…' : ''}</div>
                    <div style={s.progressBar}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>${c.reward_current}</span>
                      <span>meta: ${c.reward_goal}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/retos" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Ver todos los retos →</Link>
          </div>
        </div>
      )}

      <div style={s.section}>
        <div style={s.sectionTitle}>¿Cómo funciona?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { icon: '✍️', title: 'Publica tu reto', desc: 'Describe el reto y el monto que aceptarías por completarlo.' },
            { icon: '💰', title: 'Recibe fondos', desc: 'Otros usuarios pueden fondear tu reto para aumentar la recompensa.' },
            { icon: '🏆', title: 'Acepta el desafío', desc: 'Cualquier usuario puede aceptar un reto abierto y ponerse a trabajar.' },
            { icon: '📤', title: 'Sube tu prueba', desc: 'Al completarlo, sube un video o foto como prueba del reto realizado.' },
            { icon: '✅', title: 'Cobra tu recompensa', desc: 'El creador verifica y aprueba, entonces recibes el dinero al instante.' },
          ].map(({ icon, title, desc }, i) => (
            <div key={title} style={s.howStep}>
              <div style={s.stepNum}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{icon} {title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
