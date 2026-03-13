import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../App';

const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '420px',
  },
  title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.3rem' },
  subtitle: { color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--muted)' },
  input: {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.7rem 1rem',
    color: 'var(--text)',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  btn: {
    width: '100%',
    background: 'var(--accent)',
    color: '#fff',
    padding: '0.8rem',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1rem',
    marginTop: '0.5rem',
    transition: 'opacity 0.2s',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '1rem',
    color: 'var(--muted)',
    fontSize: '0.9rem',
  },
  link: { color: 'var(--accent2)', cursor: 'pointer', fontWeight: 600 },
  error: {
    background: '#ef444420',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  demo: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.8rem',
    marginBottom: '1.5rem',
    fontSize: '0.8rem',
    color: 'var(--muted)',
  },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const { user } = await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        login(user);
      } else {
        const { user } = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        login(user);
      }
      navigate('/retos');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.title}>{isRegister ? 'Crear cuenta' : 'Bienvenido 👋'}</div>
        <div style={styles.subtitle}>
          {isRegister ? 'Únete a la comunidad de retos' : 'Ingresa a tu cuenta para continuar'}
        </div>

        {!isRegister && (
          <div style={styles.demo}>
            <strong>Cuentas demo:</strong><br />
            pablo / demo123 — maria / demo123 — carlos / demo123<br />
            Cada cuenta tiene saldo inicial para probar.
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit}>
          <label style={styles.label}>Usuario</label>
          <input
            style={styles.input}
            name="username"
            placeholder="tu_usuario"
            value={form.username}
            onChange={handle}
            required
          />
          {isRegister && (
            <>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handle}
                required
              />
            </>
          )}
          <label style={styles.label}>Contraseña</label>
          <input
            style={styles.input}
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handle}
            required
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : isRegister ? 'Registrarme' : 'Ingresar'}
          </button>
        </form>

        <div style={styles.toggle}>
          {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          <span style={styles.link} onClick={() => { setIsRegister(r => !r); setError(''); }}>
            {isRegister ? 'Ingresar' : 'Registrarme'}
          </span>
        </div>
      </div>
    </div>
  );
}
