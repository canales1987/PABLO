const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Set defaults
db.defaults({ users: [], challenges: [], fundings: [] }).write();

// Seed demo users if empty
if (db.get('users').size().value() === 0) {
  const now = new Date().toISOString();
  db.get('users').push(
    { id: uuidv4(), username: 'pablo', email: 'pablo@demo.com', password_hash: 'demo123', balance: 500, created_at: now },
    { id: uuidv4(), username: 'maria', email: 'maria@demo.com', password_hash: 'demo123', balance: 300, created_at: now },
    { id: uuidv4(), username: 'carlos', email: 'carlos@demo.com', password_hash: 'demo123', balance: 200, created_at: now }
  ).write();
  console.log('Demo users created: pablo, maria, carlos (password: demo123)');
}

module.exports = db;
