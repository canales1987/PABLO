import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../App';

function StatusBadge({ status }) {
  const map = {
    open: { label: '🟢 Abierto', color: '#10b981' },
    active: { label: '🟡 En progreso', color: '#f59e0b' },
    pending_review: { label: '🔵 En revisión', color: '#3b82f6' },
    completed: { label: '✅ Completado', color: '#8b5cf6' },
  };
  const { label, color } = map[status] || { label: status, color: '#888' };
  return (
    <span style={{
      background: color + '22', border: `1px solid ${color}55`, color,
      borderRadius: '20px', padding: '0.3rem 1rem', fontSize: '0.85rem', fontWeight: 600,
    }}>{label}</span>
  );
}

function Alert({ type, children }) {
  const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      background: c + '18', border: `1px solid ${c}44`, color: c,
      borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.9rem',
    }}>{children}</div>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await api(`/challenges/${id}`);
      setChallenge(data);
    } catch { navigate('/retos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const doFund = async () => {
    if (!user) return navigate('/login');
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) return showMsg('error', 'Ingresa un monto válido');
    setBusy(true);
    try {
      await api(`/challenges/${id}/fund`, {
        method: 'POST',
        body: JSON.stringify({ funder_id: user.id, amount }),
      });
      setFundAmount('');
      showMsg('success', `¡Fondeaste $${amount} al reto!`);
      load();
    } catch (err) { showMsg('error', err.message); }
    setBusy(false);
  };

  const doAccept = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      await api(`/challenges/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      });
      showMsg('success', '¡Aceptaste el reto! Ahora complétalo y sube la prueba.');
      load();
    } catch (err) { showMsg('error', err.message); }
    setBusy(false);
  };

  const doComplete = async () => {
    if (!proofFile) return showMsg('error', 'Selecciona un archivo de prueba');
    setBusy(true);
    const form = new FormData();
    form.append('proof', proofFile);
    form.append('user_id', user.id);
    try {
      const res = await fetch(`/api/challenges/${id}/complete`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProofFile(null);
      if (fileRef.current) fileRef.current.value = '';
      showMsg('success', '¡Prueba subida! Esperando aprobación del creador.');
      load();
    } catch (err) { showMsg('error', err.message); }
    setBusy(false);
  };

  const doApprove = async () => {
    setBusy(true);
    try {
      await api(`/challenges/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      });
      showMsg('success', '¡Reto aprobado! La recompensa fue transferida al ganador.');
      load();
    } catch (err) { showMsg('error', err.message); }
    setBusy(false);
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await api(`/challenges/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      });
      showMsg('info', 'Prueba rechazada. El reto sigue activo.');
      load();
    } catch (err) { showMsg('error', err.message); }
    setBusy(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>Cargando...</div>;
  if (!challenge) return null;

  const pct = Math.min(100, (challenge.reward_current / challenge.reward_goal) * 100);
  const isCreator = user?.id === challenge.creator_id;
  const isAccepted = user?.id === challenge.accepted_by;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
          <StatusBadge status={challenge.status} />
          <span style={{
            background: 'var(--surface2)', borderRadius: '20px',
            padding: '0.3rem 0.8rem', fontSize: '0.8rem', color: 'var(--muted)',
          }}>{challenge.category}</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>{challenge.title}</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{challenge.description}</p>
        <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Publicado por <strong style={{ color: 'var(--text)' }}>{challenge.creator_name}</strong>
          {challenge.accepted_by_name && (
            <> · Aceptado por <strong style={{ color: 'var(--accent2)' }}>{challenge.accepted_by_name}</strong></>
          )}
        </p>
      </div>

      {/* Reward progress */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Recompensa acumulada</span>
          <span style={{ fontWeight: 700 }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '0.7rem' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: '6px', transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>${challenge.reward_current}</span>
          <span style={{ color: 'var(--muted)' }}>de <strong style={{ color: 'var(--text)' }}>${challenge.reward_goal}</strong> objetivo</span>
        </div>
      </div>

      {/* Proof media */}
      {challenge.proof_url && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.7rem' }}>📎 Prueba de completación</div>
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {challenge.proof_type === 'video' ? (
              <video src={challenge.proof_url} controls style={{ width: '100%', maxHeight: '400px', background: '#000' }} />
            ) : (
              <img src={challenge.proof_url} alt="Prueba" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#000' }} />
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Acciones</div>

        {/* Fund */}
        {['open', 'active'].includes(challenge.status) && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              💰 Fondea este reto para aumentar la recompensa
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                min="1"
                value={fundAmount}
                onChange={e => setFundAmount(e.target.value)}
                placeholder="Monto $"
                style={{
                  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--text)', fontSize: '0.9rem',
                }}
              />
              <button onClick={doFund} disabled={busy} style={{
                background: 'var(--success)', color: '#fff', padding: '0.6rem 1.2rem',
                borderRadius: '8px', fontWeight: 700, opacity: busy ? 0.6 : 1,
              }}>Fondear</button>
            </div>
            {user && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.3rem' }}>Tu saldo: ${user.balance?.toFixed(2)}</div>}
          </div>
        )}

        {/* Accept */}
        {challenge.status === 'open' && !isCreator && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              🏆 ¿Crees que puedes hacerlo? ¡Acepta el reto!
            </div>
            <button onClick={doAccept} disabled={busy} style={{
              background: 'var(--accent)', color: '#fff', padding: '0.7rem 1.5rem',
              borderRadius: '8px', fontWeight: 700, width: '100%', opacity: busy ? 0.6 : 1,
            }}>Aceptar el reto</button>
          </div>
        )}

        {/* Upload proof */}
        {challenge.status === 'active' && isAccepted && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.7rem' }}>
              📤 ¡Lo lograste! Sube tu prueba (foto o video, max 50MB)
            </div>
            <div style={{
              border: '2px dashed var(--border)', borderRadius: '10px',
              padding: '1.5rem', textAlign: 'center', marginBottom: '0.7rem', cursor: 'pointer',
            }} onClick={() => fileRef.current?.click()}>
              {proofFile ? (
                <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ✅ {proofFile.name}
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 400 }}>
                    {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                  Haz clic para seleccionar tu foto o video
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={e => setProofFile(e.target.files[0] || null)}
            />
            <button onClick={doComplete} disabled={busy || !proofFile} style={{
              background: 'var(--accent)', color: '#fff', padding: '0.7rem 1.5rem',
              borderRadius: '8px', fontWeight: 700, width: '100%',
              opacity: (busy || !proofFile) ? 0.5 : 1,
            }}>Subir prueba y completar reto</button>
          </div>
        )}

        {/* Creator review */}
        {challenge.status === 'pending_review' && isCreator && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.7rem' }}>
              🔍 Revisa la prueba y decide si el reto fue completado correctamente.
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={doApprove} disabled={busy} style={{
                flex: 1, background: 'var(--success)', color: '#fff', padding: '0.7rem',
                borderRadius: '8px', fontWeight: 700, opacity: busy ? 0.6 : 1,
              }}>✅ Aprobar y pagar</button>
              <button onClick={doReject} disabled={busy} style={{
                flex: 1, background: 'var(--surface2)', color: 'var(--danger)',
                border: '1px solid var(--danger)', padding: '0.7rem',
                borderRadius: '8px', fontWeight: 700, opacity: busy ? 0.6 : 1,
              }}>❌ Rechazar</button>
            </div>
          </div>
        )}

        {challenge.status === 'completed' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
            <div style={{ fontWeight: 700, color: 'var(--success)' }}>¡Reto completado con éxito!</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {challenge.accepted_by_name} recibió ${challenge.reward_current}
            </div>
          </div>
        )}
      </div>

      {/* Fundings list */}
      {challenge.fundings?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.8rem' }}>💸 Contribuciones</div>
          {challenge.fundings.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--muted)' }}>{f.username}</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>+${f.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
