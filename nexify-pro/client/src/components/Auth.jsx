import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, LogIn, Chrome, ArrowRight, 
  AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, X
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Auth({ onAuth, onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'register') {
        const res = await axios.post(`${API_BASE}/auth/register`, { email, password, name });
        setMsg('Welcome to the elite! Please login.');
        setMode('login');
      } else {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        onAuth(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
    setBusy(false);
  };

  const handleGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="auth-overlay" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ x: '100%', opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="auth-drawer"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={20} color="#fff" />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.3, cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <motion.div 
          key={mode}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p style={{ opacity: 0.4, fontSize: '0.95rem' }}>
            {mode === 'login' ? 'Access your Nexify Pro workspace' : 'Create your pro conversion account'}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="input-container"
              >
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder=" " 
                  className="input-field"
                  required 
                />
                <User className="input-icon" size={18} />
                <label style={{ position: 'absolute', left: '3rem', top: '1.1rem', pointerEvents: 'none', opacity: 0.4, transition: 'all 0.2s', fontSize: '0.9rem' }}>Full Name</label>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-container">
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder=" " 
              className="input-field"
              required 
            />
            <Mail className="input-icon" size={18} />
            <label style={{ position: 'absolute', left: '3rem', top: '1.1rem', pointerEvents: 'none', opacity: 0.4, transition: 'all 0.2s', fontSize: '0.9rem' }}>Email Address</label>
          </div>

          <div className="input-container">
            <input 
              type={showPass ? "text" : "password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder=" " 
              className="input-field"
              required 
            />
            <Lock className="input-icon" size={18} />
            <label style={{ position: 'absolute', left: '3rem', top: '1.1rem', pointerEvents: 'none', opacity: 0.4, transition: 'all 0.2s', fontSize: '0.9rem' }}>Password</label>
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Forgot Password?
              </button>
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)' }}>
                  <p style={{ color: '#f87171', fontSize: '0.85rem', display: 'flex', gap: '0.6rem', alignItems: 'center', margin: 0 }}>
                    <AlertCircle size={16}/> {error}
                  </p>
                </motion.div>
              )}
              {msg && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <p style={{ color: '#4ade80', fontSize: '0.85rem', display: 'flex', gap: '0.6rem', alignItems: 'center', margin: 0 }}>
                    <CheckCircle size={16}/> {msg}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button className="btn-premium" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', height: '3.5rem', fontSize: '1rem' }}>
              {busy ? <RefreshCw className="spin" size={22}/> : (<>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={20} /></>)}
            </button>
          </div>
        </form>

        <div style={{ margin: '2.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.1 }}>
          <div style={{ flex: 1, height: '1px', background: '#fff' }}/>
          {/* <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>OR CONTINUE WITH</span> */}
          <div style={{ flex: 1, height: '1px', background: '#fff' }}/>
        </div>

        {/* <button 
          onClick={handleGoogle} 
          className="btn" 
          style={{ 
            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
            display: 'flex', gap: '1rem', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem'
          }}
        >
          <Chrome size={20} color="#4285F4"/> Google Account
        </button> */    }

        <p style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.9rem', opacity: 0.4 }}>
          {mode === 'login' ? "New to Nexify?" : "Already Have account?"}
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: '#6366f1', marginLeft: '0.6rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </>
  );
}
