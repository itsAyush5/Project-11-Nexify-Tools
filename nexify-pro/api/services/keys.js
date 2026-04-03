const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');

function generateKey(userId, name) {
  const keyValue = `nx_${crypto.randomBytes(32).toString('hex')}`;
  const id = uuidv4();
  
  db.prepare('INSERT INTO api_keys (id, user_id, key_value, name) VALUES (?, ?, ?, ?)').run(
    id, userId, keyValue, name
  );
  
  return { id, keyValue, name };
}

function revokeKey(keyId, userId) {
  db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(keyId, userId);
}

function listKeys(userId) {
  return db.prepare('SELECT * FROM api_keys WHERE user_id = ?').all(userId);
}

// Middleware to authorize requests via API Key
const apiKeyMiddleware = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key) return next(); // Not an API key request, proceed to session check

  const keyRecord = db.prepare('SELECT * FROM api_keys WHERE key_value = ?').get(key);
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
