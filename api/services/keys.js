const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');

const MAX_KEYS_PER_USER = 10;

function generateKey(userId, name) {
  // Enforce the per-user limit
  const existing = db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?').get(userId);
  if (existing.count >= MAX_KEYS_PER_USER) {
    const err = new Error(`API key limit reached. You can have at most ${MAX_KEYS_PER_USER} keys.`);
    err.code = 'KEY_LIMIT_REACHED';
    throw err;
  }

  const keyValue = `nx_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = bcrypt.hashSync(keyValue, 10);
  const maskedKey = `nx_${keyValue.slice(3, 8)}...${keyValue.slice(-4)}`;
  const id = uuidv4();
  
  db.prepare('INSERT INTO api_keys (id, user_id, key_hash, masked_key, name) VALUES (?, ?, ?, ?, ?)').run(
    id, userId, keyHash, maskedKey, name
  );
  
  return { id, keyValue, name }; // Full key returned ONLY here
}

function revokeKey(keyId, userId) {
  db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(keyId, userId);
}

function listKeys(userId) {
  // Never return key_hash in the list
  return db.prepare('SELECT id, user_id, masked_key, name, created_at, last_used FROM api_keys WHERE user_id = ?').all(userId);
}

// Middleware to authorize requests via API Key
const apiKeyMiddleware = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key) return next();

  // We can't query by hash directly with bcrypt, so we have to be careful.
  // In a real high-scale system, we'd use a searchable prefix or a different hashing method.
  // For this project, we'll fetch all keys for the user? No, we don't know the user yet.
  
  // Optimization: Store a searchable non-reversible 'key_id_hash' if needed.
  // For now, since it's a small app, we'll fetch all keys and compare.
  // Actually, better: Store a 'lookup_prefix' (e.g. first 12 chars) that is unique enough.
  
  // Let's use a simple lookup:
  const allKeys = db.prepare('SELECT * FROM api_keys').all();
  const keyRecord = allKeys.find(k => bcrypt.compareSync(key, k.key_hash));

  if (!keyRecord) return res.status(401).json({ error: 'Invalid API Key' });

  // Update last used
  db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(keyRecord.id);

  // Attach user to request
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(keyRecord.user_id);
  req.user = user;
  req.authMethod = 'api-key';
  next();
};

module.exports = { generateKey, revokeKey, listKeys, apiKeyMiddleware };
