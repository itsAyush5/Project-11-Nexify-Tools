import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Trash2, Copy, Check, RefreshCw,
  AlertCircle, X, ShieldCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const MAX_KEYS = 10;

export default function ApiKeyManager() {
  const [keys, setKeys]           = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [busy, setBusy]           = useState(false);
  const [copied, setCopied]       = useState(null);
  const [keyError, setKeyError]   = useState('');
  const [newKeyData, setNewKeyData] = useState(null); // { name, keyValue }

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
      const res = await axios.post(`${API_BASE}/keys/generate`, { name: newKeyName.trim() }, { withCredentials: true });
      setNewKeyName('');
      setNewKeyData(res.data); // Store for one-time display
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

  useEffect(() => { fetchKeys(); }, []);

  const atLimit   = keys.length >= MAX_KEYS;
  const usedPct   = (keys.length / MAX_KEYS) * 100;
  const quotaColor = keys.length >= MAX_KEYS ? '#ef4444' : keys.length >= 7 ? '#f97316' : '#6366f1';

  return (
    <div className="card" style={{ padding: '2rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={18} color="#f59e0b" />
            </div>
            Developer API Keys
          </h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Keys are securely hashed. For your security, **keys are only shown once** upon generation.
          </p>
        </div>

        <span style={{
          fontSize: '0.8rem', fontWeight: 700, padding: '0.4rem 1rem',
          borderRadius: '99px',
          background: atLimit ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
          color: quotaColor,
          border: `1px solid ${atLimit ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
        }}>
          {keys.length} / {MAX_KEYS} keys
        </span>
      </div>

      {/* Quota bar */}
      <div style={{ margin: '2rem 0' }}>
        <div style={{ height: 6, borderRadius: '99px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${usedPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg, ${quotaColor}, ${quotaColor}cc)` }}
          />
        </div>
      </div>

      {/* Generate form */}
      <form
        onSubmit={generateKey}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', opacity: atLimit ? 0.45 : 1, transition: 'opacity 0.3s' }}
      >
        <input
          type="text"
          placeholder={atLimit ? 'Limit reached (max 10)' : 'Key name (e.g. Production Backend, Testing)'}
          value={newKeyName}
          onChange={e => { setNewKeyName(e.target.value); setKeyError(''); }}
          disabled={atLimit}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${keyError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px',
            padding: '0.85rem 1.2rem', color: '#fff',
            fontFamily: 'inherit', fontSize: '0.95rem',
            outline: 'none', transition: 'all 0.2s',
            cursor: atLimit ? 'not-allowed' : 'text',
          }}
          onFocus={e => { if (!atLimit) { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)'; } }}
          onBlur={e => { e.target.style.borderColor = keyError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={busy || atLimit || !newKeyName.trim()}
          style={{ whiteSpace: 'nowrap', padding: '0 1.5rem', height: '3.4rem', borderRadius: '12px' }}
        >
          {busy ? <RefreshCw className="spin" size={18} /> : <><Plus size={18} /> Generate Key</>}
        </button>
      </form>

      {/* Error */}
      <AnimatePresence>
        {keyError && (
          <motion.p
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(248,113,113,0.08)', padding: '0.75rem 1rem', borderRadius: '8px' }}
          >
            <AlertCircle size={15} /> {keyError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Key list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {keys.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Key size={26} color="#6366f1" />
            </div>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>No API keys yet</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', maxWidth: 280, margin: '0.5rem auto 0', lineHeight: 1.5 }}>
              Generate your first key to start using Nexify Tools programmatically.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {keys.map((k, i) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: '1.25rem 1.5rem',
                background: 'rgba(255,255,255,0.025)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#4ade80" />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'white' }}>{k.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem' }}>
                  <code style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                    {k.masked_key}
                  </code>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <ActionButton
                  icon={Trash2}
                  onClick={() => revokeKey(k.id)}
                  danger
                  label="Revoke"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* One-time Display Modal */}
      <AnimatePresence>
        {newKeyData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNewKeyData(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <ShieldCheck size={32} color="#4ade80" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>New API Key Generated</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Copy this key now. For your security, we won't show it again.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <code style={{ flex: 1, color: '#a5b4fc', fontSize: '0.95rem', fontWeight: 600, wordBreak: 'break-all' }}>{newKeyData.keyValue}</code>
                <button 
                  onClick={() => copyToClipboard(newKeyData.keyValue, 'new-key')}
                  style={{ flexShrink: 0, background: copied === 'new-key' ? '#22c55e' : 'rgba(99,102,241,0.1)', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', color: 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {copied === 'new-key' ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                </button>
              </div>

              <button 
                onClick={() => setNewKeyData(null)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1rem', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                I've copied the key
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ icon: Icon, onClick, active, success, danger, label }) {
  const baseBg = danger ? 'rgba(244,63,94,0.08)' : success ? 'rgba(34,197,94,0.1)' : active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)';
  const baseColor = danger ? '#fb7185' : success ? '#4ade80' : active ? '#a5b4fc' : 'rgba(255,255,255,0.4)';
  const hoverBg = danger ? 'rgba(244,63,94,0.16)' : success ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)';
  const hoverColor = danger ? '#ff4d6d' : success ? '#22c55e' : 'white';

  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 38, height: 38, borderRadius: '10px',
        border: '1px solid transparent', background: baseBg,
        color: baseColor, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = baseBg;
        e.currentTarget.style.color = baseColor;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <Icon size={16} />
    </button>
  );
}
