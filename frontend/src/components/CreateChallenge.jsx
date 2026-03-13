import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../App';

const CATEGORIES = ['general', 'deportes', 'humor', 'talento', 'social', 'gaming', 'otro'];

export default function CreateChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    reward_goal: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    const reward = parseFloat(form.reward_goal);
    if (!form.title.trim()) return setError('El título es requerido');
    if (!form.description.trim()) return setError('La descripción es requerida');
    if (!reward || reward <= 0) return setError('Ingresa una recompensa válida mayor a $0');

    setLoading(true);
    try {
      const challenge = await api('/challenges', {
        method: 'POST',
        body: JSON.stringify({ ...form, reward_goal: reward, creator_id: user.id }),
      });
      navigate(`/retos/${challenge.id}`);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const s = {
    page: { maxWidth: '600px', margin: '0 auto', padding: '2rem' },
    label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 },
    input: {
      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.7rem 1rem', color: 'var(--text)',
      fontSize: '0.95rem', marginBottom: '1.2rem',
    },
    textarea: {
      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.7rem 1rem', color: 'var(--text)',
      fontSize: '0.95rem', marginBottom: '1.2rem', resize: 'vertical', minHeight: '100px',
    },
    select: {
      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.7rem 1rem', color: 'var(--text)',
      fontSize: '0.95rem', marginBottom: '1.2rem',
    },
    error: {
      background: '#ef444420', border: '1px solid var(--danger)', color: 'var(--danger)',
      padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem',
    },
    btn: {
      width: '100%', background: 'var(--accent)', color: '#fff', padding: '0.9rem',
      borderRadius: '10px', fontWeight: 700, fontSize: '1rem',
      opacity: loading ? 0.7 : 1,
    },
    tip: {
      background: '#7c3aed15', border: '1px solid #7c3aed44', borderRadius: '10px',
      padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5,
    },
  };

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>🎯 Crear Reto</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Define el reto, establece cuánto aceptarías por completarlo, y publícalo para que otros lo fondeen.
      </p>

      <div style={s.tip}>
        💡 <strong>Tip:</strong> Cuanto más claro y emocionante sea tu reto, más probabilidades de recibir fondos.
        El monto que estableces es lo mínimo que aceptarías — otros usuarios pueden aumentarlo.
      </div>

      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={submit}>
        <label style={s.label}>Título del reto *</label>
        <input
          style={s.input}
          name="title"
          placeholder="ej. Me como 3 pizzas enteras en 30 minutos"
          value={form.title}
          onChange={handle}
          maxLength={120}
          required
        />

        <label style={s.label}>Descripción *</label>
        <textarea
          style={s.textarea}
          name="description"
          placeholder="Explica detalladamente en qué consiste el reto, las reglas y cómo se verificará que lo completaste..."
          value={form.description}
          onChange={handle}
          required
        />

        <label style={s.label}>Categoría</label>
        <select style={s.select} name="category" value={form.category} onChange={handle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>

        <label style={s.label}>Recompensa mínima que aceptarías ($) *</label>
        <input
          style={s.input}
          name="reward_goal"
          type="number"
          min="1"
          step="0.01"
          placeholder="ej. 50"
          value={form.reward_goal}
          onChange={handle}
          required
        />
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '-1rem', marginBottom: '1.2rem' }}>
          Este es el monto objetivo. Otros usuarios pueden fondear el reto para sumar más dinero.
        </div>

        <button style={s.btn} type="submit" disabled={loading}>
          {loading ? 'Publicando...' : '🚀 Publicar reto'}
        </button>
      </form>
    </div>
  );
}
