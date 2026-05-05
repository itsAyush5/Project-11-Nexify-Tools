import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Trash2, Copy, Check, RefreshCw, LogOut,
  ShieldCheck, Mail, User, AlertCircle, Calendar, Clock,
  Eye, EyeOff, Zap
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const MAX_KEYS = 10;

export default function Profile({ user, onLogout, keysOnly = false }) {
  const [keys, setKeys]           = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [busy, setBusy]           = useState(false);
  const [copied, setCopied]       = useState(null);
  const [keyError, setKeyError]   = useState('');
  const [revealed, setRevealed]   = useState({});

  const fetchKeys = async () => {
    try {
      const res = await axios.get(`${API_BASE}/keys/list`, { withCredentials: true });
      setKeys(res.data);
    } catch (err) { console.error('Failed to fetch keys', err); }
  };

  const generateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim() || busy || keys.length >= MAX_KEYS) return;
    setKeyError('');
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/keys/generate`, { name: newKeyName.trim() }, { withCredentials: true });
      setNewKeyName('');
      fetchKeys();
    } catch (err) {
      setKeyError(err.response?.data?.error || 'Failed to generate key');
    }
    setBusy(false);
  };

  const revokeKey = async (id) => {
    try {
      await axios.post(`${API_BASE}/keys/revoke`, { id }, { withCredentials: true });
      fetchKeys();
    } catch (err) { console.error('Failed to revoke key', err); }
  };

  const copyToClipboard = (val, id) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleReveal = (id) => {
    setRevealed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => { fetchKeys(); }, []);

  const atLimit   = keys.length >= MAX_KEYS;
  const usedPct   = (keys.length / MAX_KEYS) * 100;
  const quotaColor = keys.length >= MAX_KEYS ? '#ef4444' : keys.length >= 7 ? '#f97316' : '#6366f1';

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Recently joined';

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Profile Hero Card ─────────────────────────────────── */}
      {!keysOnly && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
            background: 'rgba(10,10,18,0.85)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Cover gradient banner */}
          <div style={{
            height: 140,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.25) 40%, rgba(236,72,153,0.2) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', top: -100, right: -60, filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(236,72,153,0.1)', top: -50, left: 100, filter: 'blur(30px)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.012) 20px, rgba(255,255,255,0.012) 21px)' }} />
          </div>

          {/* Avatar + identity */}
          <div style={{ padding: '0 2rem 2rem', position: 'relative' }}>
            {/* Avatar ring + badge */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: user?.pic ? 'transparent' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                  border: '4px solid rgba(10,10,18,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 2px rgba(99,102,241,0.4), 0 8px 24px rgba(0,0,0,0.5)',
                  fontSize: '1.5rem', fontWeight: 800, color: 'white',
                  overflow: 'hidden',
                }}>
                  {user?.pic
                    ? <img src={user.pic} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials
                  }
                </div>
                {/* Online dot */}
                <span style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid rgba(10,10,18,1)',
                  boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                }} />
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.55rem 1.2rem',
                  borderRadius: '99px',
                  border: '1px solid rgba(248,113,113,0.3)',
                  background: 'rgba(248,113,113,0.07)',
                  color: '#f87171',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.14)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>

            {/* Name + email */}
            <div style={{ marginTop: '1.1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {user?.name || 'User'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                <Mail size={14} />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Info pills row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
              {/* Verified badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.4rem 1rem',
                borderRadius: '99px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#4ade80',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                <ShieldCheck size={14} /> Nexify Verified
              </div>

              {/* Join date */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.4rem 1rem',
                borderRadius: '99px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.8rem', fontWeight: 500,
              }}>
                <Calendar size={13} /> Joined {joinDate}
              </div>

              {/* Keys used */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.4rem 1rem',
                borderRadius: '99px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.18)',
                color: '#a5b4fc',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                <Key size={13} /> {keys.length} / {MAX_KEYS} API Keys
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── API Key Manager ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: 700 }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={16} color="#f59e0b" />
              </div>
              Developer API Keys
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
              Use these keys in the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>x-api-key</code> header to authorize requests.
            </p>
          </div>

          <span style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.85rem',
            borderRadius: '99px',
            background: atLimit ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
            color: quotaColor,
            border: `1px solid ${atLimit ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
          }}>
            {keys.length}/{MAX_KEYS}
          </span>
        </div>

        {/* Quota bar */}
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ height: 4, borderRadius: '99px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg, ${quotaColor}, ${quotaColor}cc)` }}
            />
          </div>
          {atLimit && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={12} /> Limit reached — revoke a key to create a new one.
            </p>
          )}
        </div>

        {/* Generate form */}
        <form
          onSubmit={generateKey}
          style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', opacity: atLimit ? 0.45 : 1, transition: 'opacity 0.3s' }}
        >
          <input
            type="text"
            placeholder={atLimit ? 'Key limit reached (max 10)' : 'Name your key — e.g. Production, Mobile App'}
            value={newKeyName}
            onChange={e => { setNewKeyName(e.target.value); setKeyError(''); }}
            disabled={atLimit}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${keyError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '10px',
              padding: '0.7rem 1rem', color: '#fff',
              fontFamily: 'inherit', fontSize: '0.88rem',
              outline: 'none', transition: 'border-color 0.2s',
              cursor: atLimit ? 'not-allowed' : 'text',
            }}
            onFocus={e => { if (!atLimit) e.target.style.borderColor = 'rgba(99,102,241,0.45)'; }}
            onBlur={e => { e.target.style.borderColor = keyError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'; }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy || atLimit || !newKeyName.trim()}
            style={{ whiteSpace: 'nowrap', padding: '0.7rem 1.3rem' }}
          >
            {busy ? <RefreshCw className="spin" size={15} /> : <><Plus size={15} /> New Key</>}
          </button>
        </form>

        {/* Error */}
        <AnimatePresence>
          {keyError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <AlertCircle size={13} /> {keyError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Key list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {keys.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Key size={22} color="#6366f1" />
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>No keys yet</p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>Generate your first API key above to get started.</p>
            </div>
          )}

          <AnimatePresence>
            {keys.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  padding: '1rem 1.1rem',
                  background: 'rgba(255,255,255,0.025)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                {/* Status dot */}
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />

                {/* Key info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'white' }}>{k.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <code style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', fontFamily: "'Courier New', monospace" }}>
                      {revealed[k.id] ? k.key_value : `${k.key_value.slice(0, 12)}${'•'.repeat(20)}`}
                    </code>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  {/* Toggle reveal */}
                  <button
                    onClick={() => toggleReveal(k.id)}
                    title={revealed[k.id] ? 'Hide key' : 'Reveal key'}
                    style={{
                      width: 32, height: 32, borderRadius: '8px',
                      border: 'none', background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {revealed[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => copyToClipboard(k.key_value, k.id)}
                    title="Copy key"
                    style={{
                      width: 32, height: 32, borderRadius: '8px',
                      border: 'none',
                      background: copied === k.id ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)',
                      color: copied === k.id ? '#4ade80' : '#a5b4fc',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {copied === k.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>

                  {/* Revoke */}
                  <button
                    onClick={() => revokeKey(k.id)}
                    title="Revoke key"
                    style={{
                      width: 32, height: 32, borderRadius: '8px',
                      border: 'none', background: 'rgba(244,63,94,0.08)',
                      color: '#fb7185', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.16)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
