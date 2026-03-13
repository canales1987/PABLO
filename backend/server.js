const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer config for proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `proof_${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|webm/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Solo se permiten imágenes y videos'));
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getChallengeWithNames(c) {
  const creator = db.get('users').find({ id: c.creator_id }).value();
  const acceptor = c.accepted_by ? db.get('users').find({ id: c.accepted_by }).value() : null;
  return {
    ...c,
    creator_name: creator?.username || '?',
    accepted_by_name: acceptor?.username || null,
  };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('users').find({ username }).value();
  if (!user || user.password_hash !== password)
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  const { password_hash, ...safe } = user;
  res.json({ user: safe });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (db.get('users').find({ username }).value())
    return res.status(409).json({ error: 'El usuario ya existe' });
  if (db.get('users').find({ email }).value())
    return res.status(409).json({ error: 'El email ya está registrado' });

  const user = {
    id: uuidv4(), username, email, password_hash: password,
    balance: 0, created_at: new Date().toISOString(),
  };
  db.get('users').push(user).write();
  const { password_hash, ...safe } = user;
  res.status(201).json({ user: safe });
});

// ─── USERS ───────────────────────────────────────────────────────────────────

app.get('/api/users/:id', (req, res) => {
  const user = db.get('users').find({ id: req.params.id }).value();
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { password_hash, ...safe } = user;
  res.json(safe);
});

// ─── CHALLENGES ───────────────────────────────────────────────────────────────

app.get('/api/challenges', (req, res) => {
  const { status, category } = req.query;
  let list = db.get('challenges').value();
  if (status) list = list.filter(c => c.status === status);
  if (category) list = list.filter(c => c.category === category);
  list = list.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(getChallengeWithNames));
});

app.get('/api/challenges/:id', (req, res) => {
  const c = db.get('challenges').find({ id: req.params.id }).value();
  if (!c) return res.status(404).json({ error: 'Reto no encontrado' });
  const fundings = db.get('fundings').filter({ challenge_id: c.id }).value().map(f => {
    const user = db.get('users').find({ id: f.funder_id }).value();
    return { ...f, username: user?.username || '?' };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ ...getChallengeWithNames(c), fundings });
});

app.post('/api/challenges', (req, res) => {
  const { creator_id, title, description, category, reward_goal } = req.body;
  if (!creator_id || !title || !description || !reward_goal)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  if (reward_goal <= 0)
    return res.status(400).json({ error: 'La recompensa debe ser mayor a 0' });
  if (!db.get('users').find({ id: creator_id }).value())
    return res.status(404).json({ error: 'Usuario no encontrado' });

  const challenge = {
    id: uuidv4(), creator_id, title, description,
    category: category || 'general',
    reward_goal: parseFloat(reward_goal), reward_current: 0,
    status: 'open', accepted_by: null,
    proof_url: null, proof_type: null,
    created_at: new Date().toISOString(), completed_at: null,
  };
  db.get('challenges').push(challenge).write();
  res.status(201).json(challenge);
});

// Fund a challenge
app.post('/api/challenges/:id/fund', (req, res) => {
  const { funder_id, amount } = req.body;
  const amt = parseFloat(amount);
  if (!funder_id || !amt || amt <= 0)
    return res.status(400).json({ error: 'Monto inválido' });

  const challenge = db.get('challenges').find({ id: req.params.id }).value();
  if (!challenge) return res.status(404).json({ error: 'Reto no encontrado' });
  if (!['open', 'active'].includes(challenge.status))
    return res.status(400).json({ error: 'Este reto ya no acepta fondos' });

  const funder = db.get('users').find({ id: funder_id }).value();
  if (!funder) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (funder.balance < amt)
    return res.status(400).json({ error: 'Saldo insuficiente' });

  db.get('users').find({ id: funder_id }).assign({ balance: funder.balance - amt }).write();
  db.get('challenges').find({ id: challenge.id })
    .assign({ reward_current: challenge.reward_current + amt }).write();
  db.get('fundings').push({
    id: uuidv4(), challenge_id: challenge.id, funder_id, amount: amt,
    created_at: new Date().toISOString(),
  }).write();

  const updated = db.get('challenges').find({ id: challenge.id }).value();
  res.json(getChallengeWithNames(updated));
});

// Accept a challenge
app.post('/api/challenges/:id/accept', (req, res) => {
  const { user_id } = req.body;
  const challenge = db.get('challenges').find({ id: req.params.id }).value();
  if (!challenge) return res.status(404).json({ error: 'Reto no encontrado' });
  if (challenge.status !== 'open')
    return res.status(400).json({ error: 'El reto no está disponible para aceptar' });
  if (challenge.creator_id === user_id)
    return res.status(400).json({ error: 'No puedes aceptar tu propio reto' });

  db.get('challenges').find({ id: challenge.id })
    .assign({ status: 'active', accepted_by: user_id }).write();

  const updated = db.get('challenges').find({ id: challenge.id }).value();
  res.json(getChallengeWithNames(updated));
});

// Upload proof of completion
app.post('/api/challenges/:id/complete', upload.single('proof'), (req, res) => {
  const { user_id } = req.body;
  const challenge = db.get('challenges').find({ id: req.params.id }).value();
  if (!challenge) return res.status(404).json({ error: 'Reto no encontrado' });
  if (challenge.status !== 'active')
    return res.status(400).json({ error: 'El reto no está activo' });
  if (challenge.accepted_by !== user_id)
    return res.status(403).json({ error: 'Solo el aceptante puede subir la prueba' });
  if (!req.file)
    return res.status(400).json({ error: 'Se requiere un archivo de prueba' });

  const proofUrl = `/uploads/${req.file.filename}`;
  const proofType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

  db.get('challenges').find({ id: challenge.id }).assign({
    status: 'pending_review',
    proof_url: proofUrl,
    proof_type: proofType,
    completed_at: new Date().toISOString(),
  }).write();

  const updated = db.get('challenges').find({ id: challenge.id }).value();
  res.json(getChallengeWithNames(updated));
});

// Approve completion → transfer reward
app.post('/api/challenges/:id/approve', (req, res) => {
  const { user_id } = req.body;
  const challenge = db.get('challenges').find({ id: req.params.id }).value();
  if (!challenge) return res.status(404).json({ error: 'Reto no encontrado' });
  if (challenge.status !== 'pending_review')
    return res.status(400).json({ error: 'El reto no está en revisión' });
  if (challenge.creator_id !== user_id)
    return res.status(403).json({ error: 'Solo el creador puede aprobar el reto' });

  const winner = db.get('users').find({ id: challenge.accepted_by }).value();
  db.get('users').find({ id: challenge.accepted_by })
    .assign({ balance: winner.balance + challenge.reward_current }).write();
  db.get('challenges').find({ id: challenge.id })
    .assign({ status: 'completed' }).write();

  const updated = db.get('challenges').find({ id: challenge.id }).value();
  res.json(getChallengeWithNames(updated));
});

// Reject proof → back to active
app.post('/api/challenges/:id/reject', (req, res) => {
  const { user_id } = req.body;
  const challenge = db.get('challenges').find({ id: req.params.id }).value();
  if (!challenge) return res.status(404).json({ error: 'Reto no encontrado' });
  if (challenge.status !== 'pending_review')
    return res.status(400).json({ error: 'El reto no está en revisión' });
  if (challenge.creator_id !== user_id)
    return res.status(403).json({ error: 'Solo el creador puede rechazar el reto' });

  db.get('challenges').find({ id: challenge.id })
    .assign({ status: 'active', proof_url: null, proof_type: null }).write();

  const updated = db.get('challenges').find({ id: challenge.id }).value();
  res.json(getChallengeWithNames(updated));
});

// ─── STATS ───────────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const all = db.get('challenges').value();
  const completed = all.filter(c => c.status === 'completed');
  res.json({
    total: all.length,
    completed: completed.length,
    totalRewards: completed.reduce((s, c) => s + c.reward_current, 0),
    active: all.filter(c => ['open', 'active'].includes(c.status)).length,
  });
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
