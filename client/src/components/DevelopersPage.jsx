import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Terminal, Globe, BookOpen, Shield, Cpu, ChevronRight, Zap, Key, FileText } from 'lucide-react';
import ApiKeyManager from './ApiKeyManager';
import Documentation from './Documentation';

export default function DevelopersPage({ user, onSignIn }) {
  const [subTab, setSubTab] = useState('keys'); // 'keys' | 'docs'

  if (!user) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '8rem 1.5rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
          <Cpu size={32} color="#6366f1" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Developer Platform</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Nexify Tools provides a powerful API for high-fidelity file conversions. Sign in to access your developer credentials.
        </p>
        <button onClick={onSignIn} className="hero-cta-primary">
          <Zap size={18} /> Get API Access
        </button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1200, padding: '3rem 1.5rem 8rem' }}>
      {/* Header section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366f1', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
          <div style={{ width: 12, height: 2, background: '#6366f1' }} />
          Developers
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.04em', color: 'white' }}>
          API Platform
        </h1>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            onClick={() => setSubTab('keys')}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
              background: subTab === 'keys' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: subTab === 'keys' ? 'white' : 'rgba(255,255,255,0.4)',
              fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s'
            }}
          >
            <Key size={16} /> API Credentials
          </button>
          <button 
            onClick={() => setSubTab('docs')}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
              background: subTab === 'docs' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: subTab === 'docs' ? 'white' : 'rgba(255,255,255,0.4)',
              fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s'
            }}
          >
            <FileText size={16} /> Documentation
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'keys' ? (
          <motion.div 
            key="keys" 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem', alignItems: 'start' }}
          >
            {/* Main: API Key Manager */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <ApiKeyManager />

              {/* Quick Start Card */}
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                  <Terminal size={18} color="#6366f1" /> Implementation Guide
                </h3>

                <div style={{ background: '#0a0a0f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', marginBottom: '1.5rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>BASH / CURL</div>
                  <pre style={{ margin: 0, fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.6, overflowX: 'auto' }}>
                    <code>{`curl -X POST "https://nexify-tools.web.app/api/v1/convert" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "target=docx"`}</code>
                  </pre>
                </div>

                <button 
                  className="btn" 
                  style={{ width: '100%', justifyContent: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => setSubTab('docs')}
                >
                  <BookOpen size={16} /> Explore Detailed Documentation <ChevronRight size={16} style={{ opacity: 0.4 }} />
                </button>
              </div>
            </div>

            {/* Sidebar: Documentation & Resources */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Quick Resources</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <ResourceItem icon={Code} label="SDKs & Client Libraries" />
                  <ResourceItem icon={Globe} label="REST API Reference" />
                  <ResourceItem icon={Shield} label="Security Best Practices" />
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc' }}>Need Help?</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Our developer relations team is available for enterprise integration support.
                </p>
                <button className="btn-premium" style={{ width: '100%', justifyContent: 'center' }}>
                  Contact DevSupport
                </button>
              </div>
            </aside>
          </motion.div>
        ) : (
          <motion.div 
            key="docs" 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ marginTop: '-4rem' }} // Offset since it has its own padding/header
          >
            <Documentation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResourceItem({ icon: Icon, label }) {
  return (
    <button style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem', borderRadius: '10px', border: 'none',
      background: 'transparent', color: 'rgba(255,255,255,0.5)',
      fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'white'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
    >
      <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} />
      </div>
      {label}
    </button>
  );
}
