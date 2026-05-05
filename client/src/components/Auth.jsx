import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, LogIn, ArrowRight, 
  AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, X,
  ShieldCheck, ShieldAlert
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// Allowed email domains
const ALLOWED_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'icloud.com', 'protonmail.com', 'me.com', 'live.com',
  'msn.com', 'aol.com', 'mail.com', 'zoho.com',
];

function getEmailError(email) {
  if (!email) return 'Email is required';
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[1]) return 'Enter a valid email address';
  const domain = parts[1].toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return `Domain not allowed. Use: ${ALLOWED_DOMAINS.slice(0, 4).join(', ')} etc.`;
  }
  return '';
}

function getPasswordStrength(pwd) {
  const checks = {
    length:   pwd.length >= 8,
    upper:    /[A-Z]/.test(pwd),
    lower:    /[a-z]/.test(pwd),
    number:   /\d/.test(pwd),
    special:  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

function StrengthMeter({ score }) {
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.35rem' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '99px',
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {score > 0 && (
        <p style={{ fontSize: '0.72rem', color: colors[score], fontWeight: 600 }}>
          {labels[score]}
        </p>
      )}
    </div>
  );
}

function PasswordChecklist({ checks }) {
  const rules = [
    { key: 'length',  label: 'At least 8 characters' },
    { key: 'upper',   label: 'One uppercase letter' },
    { key: 'lower',   label: 'One lowercase letter' },
    { key: 'number',  label: 'One number' },
    { key: 'special', label: 'One special character (!@#$…)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
      {rules.map(r => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {checks[r.key]
            ? <CheckCircle size={13} color="#4ade80" />
            : <AlertCircle size={13} color="rgba(255,255,255,0.2)" />}
          <span style={{ fontSize: '0.72rem', color: checks[r.key] ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Auth({ onAuth, onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const emailError = getEmailError(email);
  const { checks: pwdChecks, score: pwdScore } = getPasswordStrength(password);
  const pwdValid = pwdScore === 5;

  const isLoginValid = !emailError && password.length >= 1;
  const isRegisterValid = name.trim().length >= 2 && !emailError && pwdValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

    if (mode === 'register') {
      if (!isRegisterValid) return;
    } else {
      if (!isLoginValid) return;
    }

    setError(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'register') {
        await axios.post(`${API_BASE}/auth/register`, { email, password, name });
        setMsg('Account created! Please sign in.');
        setMode('login');
        setTouched({ name: false, email: false, password: false });
      } else {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        onAuth(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    }
    setBusy(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError(''); setMsg('');
    setTouched({ name: false, email: false, password: false });
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '14px',
    padding: '0.9rem 1rem 0.9rem 3rem',
    color: '#fff',
    fontSize: '0.93rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        style={{
          position: 'fixed', top: 0, right: 0,
          width: '440px', maxWidth: '100vw',
          height: '100vh',
          background: 'rgba(8,8,14,0.97)',
          backdropFilter: 'blur(40px) saturate(180%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          zIndex: 1000,
          padding: '3rem',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={18} color="#fff" />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.3, cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>
              {mode === 'login'
                ? 'Sign in to your Nexify Tools workspace'
                : 'Set up your free conversion account'}
            </p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Full Name (register only) */}
          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Full Name</span>
                  <span style={{ color: '#f87171', fontSize: '0.8rem' }}>*</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, name: true }))}
                    style={inputStyle(touched.name && name.trim().length < 2)}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                    onBlurCapture={e => { e.target.style.borderColor = name.trim().length < 2 && touched.name ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {touched.name && name.trim().length < 2 && (
                  <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={12} /> Name must be at least 2 characters
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div>
            <div style={{ marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Email Address</span>
              <span style={{ color: '#f87171', fontSize: '0.8rem' }}>*</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                style={inputStyle(touched.email && !!emailError)}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlurCapture={e => { e.target.style.borderColor = touched.email && emailError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              {/* valid tick */}
              {email && !emailError && (
                <CheckCircle size={15} color="#4ade80" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </div>
            {touched.email && emailError && (
              <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={12} /> {emailError}
              </p>
            )}
            {!emailError && !email && touched.email && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: '0.35rem' }}>
                Supported: {ALLOWED_DOMAINS.slice(0, 5).join(', ')}…
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div style={{ marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Password</span>
              <span style={{ color: '#f87171', fontSize: '0.8rem' }}>*</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Create a strong password' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                style={{ ...inputStyle(touched.password && mode === 'register' && !pwdValid && password.length > 0), paddingRight: '2.8rem' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlurCapture={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.35, color: '#fff' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter — only on register */}
            {mode === 'register' && password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <StrengthMeter score={pwdScore} />
                <PasswordChecklist checks={pwdChecks} />
              </motion.div>
            )}

            {/* Login: minimal length hint */}
            {mode === 'login' && touched.password && !password && (
              <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={12} /> Password is required
              </p>
            )}
          </div>

          {/* Forgot password (login only) */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
              <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', opacity: 0.8 }}>
                Forgot password?
              </button>
            </div>
          )}

          {/* Server error / success */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p style={{ color: '#f87171', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0 }}>
                  <AlertCircle size={15} /> {error}
                </p>
              </motion.div>
            )}
            {msg && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p style={{ color: '#4ade80', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0 }}>
                  <CheckCircle size={15} /> {msg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: '0.5rem',
              width: '100%', height: '3.2rem',
              borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { if (!busy) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 24px -4px rgba(99,102,241,0.5)'; }}}
            onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 8px 20px -4px rgba(99,102,241,0.4)'; }}
          >
            {busy
              ? <RefreshCw className="spin" size={20} />
              : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.25, letterSpacing: '0.08em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Switch mode */}
        <p style={{ textAlign: 'center', fontSize: '0.88rem', opacity: 0.4, marginTop: 'auto' }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={switchMode}
            style={{ background: 'none', border: 'none', color: '#6366f1', marginLeft: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </>
  );
}
