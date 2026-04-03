import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Trash, RefreshCw, LogOut, ShieldCheck, Mail, User } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Profile({ user, onLogout }) {
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null);

  const fetchKeys = async () => {
    try {
      const res = await axios.get(`${API_BASE}/keys/list`, { withCredentials: true });
      setKeys(res.data);
    } catch (err) { console.error('Failed to fetch keys', err); }
  };

  const generateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName || busy) return;
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/keys/generate`, { name: newKeyName }, { withCredentials: true });
      setNewKeyName('');
      fetchKeys();
    } catch (err) { console.error('Failed to generate key', err); }
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

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
      
      {/* Profile Info */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          {user.pic 
            ? <img src={user.pic} style={{ width: 64, height: 64, borderRadius: '50%' }} alt="Avatar"/>
            : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={32} color="#6366f1"/></div>
          }
          <div>
            <h2 style={{ margin: 0 }}>{user.name || 'User Profile'}</h2>
            <p style={{ margin: 0, opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14}/> {user.email}</p>
          </div>
        </div>

        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <ShieldCheck size={20} color="#22c55e"/>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#86efac' }}>Account verified and protected via Nexify Auth.</p>
        </div>

        <button onClick={onLogout} className="btn" style={{ width: '100%', borderColor: '#f87171', color: '#f87171', background: 'transparent' }}>
          <LogOut size={16}/> Logout Account
        </button>
      </motion.div>

      {/* API Key Management */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Key size={20} color="#f59e0b"/> Developer API Keys
        </h3>
        
        <form onSubmit={generateKey} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Key Name (e.g. Production)" 
            value={newKeyName} 
            onChange={e => setNewKeyName(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#fff' }}
          />
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? <RefreshCw className="spin" size={16}/> : (<><Plus size={16}/> New Key</>)}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {keys.length === 0 && <p style={{ textAlign: 'center', opacity: 0.4, fontStyle: 'italic', margin: '2rem 0' }}>No API keys generated yet.</p>}
          <AnimatePresence>
            {keys.map(k => (
              <motion.div 
                key={k.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{k.name}</p>
                  <code style={{ fontSize: '0.75rem', opacity: 0.5, letterSpacing: '0.05rem' }}>{k.key_value.slice(0, 15)}••••••••••••••••</code>
                </div>
                <button 
                  onClick={() => copyToClipboard(k.key_value, k.id)} 
                  className="btn" 
                  style={{ padding: '0.4rem', border: 'none', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', cursor: 'pointer' }}
                >
                  {copied === k.id ? <Check size={16} color="#22c55e"/> : <Copy size={16}/>}
                </button>
                <button 
                  onClick={() => revokeKey(k.id)} 
                  className="btn" 
                  style={{ padding: '0.4rem', border: 'none', background: 'rgba(244,63,94,0.1)', color: '#fb7185', cursor: 'pointer' }}
                >
                  <Trash2 size={16}/>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.75rem', opacity: 0.4, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
          Use these keys in your `x-api-key` header to authorize requests to the Nexify Engines from your own applications.
        </p>
      </motion.div>
    </div>
  );
}
