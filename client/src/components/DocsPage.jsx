import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, Zap, Shield, Cpu, Code, Globe, User, Star, 
  Layers, CheckCircle2, Heart, Award, ArrowRight,
  Terminal, FileText, Info, Github
} from 'lucide-react';
import Documentation from './Documentation'; // This is the API doc

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'features' | 'api'

  return (
    <div className="page-container" style={{ maxWidth: 1200, padding: '4rem 1.5rem 8rem' }}>
      {/* Header section */}
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center' }}
        >
          <img src="/Nexify Tools.png" alt="Nexify Tools Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        </motion.div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.04em', color: 'white' }}>
          Nexify Tools <span style={{ color: 'rgba(255,255,255,0.3)' }}>Docs</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.2rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Everything you need to know about the most powerful file conversion platform on the web.
        </p>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '5rem' }}>
        <NavPill active={activeTab === 'overview'} label="Project Overview" icon={Info} onClick={() => setActiveTab('overview')} />
        <NavPill active={activeTab === 'features'} label="Features & Tools" icon={Layers} onClick={() => setActiveTab('features')} />
        {/* <NavPill active={activeTab === 'api'}      label="Developer API"   icon={Terminal} onClick={() => setActiveTab('api')} /> */}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '5rem', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>The Future of File Processing.</h2>
                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '2rem' }}>
                  Nexify Tools was born from a simple realization: web-based file tools shouldn't be clunky, ad-ridden, or insecure. We built a platform that combines <strong>desktop-class performance</strong> with the <strong>beauty of modern web design</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ValueProp icon={Shield} title="Privacy First" desc="Your files are processed in secure environments and auto-deleted within 1 hour." />
                  <ValueProp icon={Zap} title="Lightning Fast" desc="Powered by a custom-built Go-based engine for near-instant processing." />
                </div>
              </div>

              <div className="card" style={{ padding: '3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'white' }}>
                  <User size={20} color="#6366f1" /> Developer Profile
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    A
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'white' }}>Ayush Kunkulol</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                      Full-stack Developer & UI Designer. Passionate about creating seamless user experiences and robust distributed systems.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <StatItem label="Projects" val="12+" />
                  <StatItem label="Lines of Code" val="5k+" />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <a href="https://ayush-devspace5.web.app" target="_blank" rel="noopener noreferrer" className="btn" style={{ flex: 1, justifyContent: 'center', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'white', textDecoration: 'none', fontSize: '0.85rem' }}>
                    <Globe size={14} /> Portfolio
                  </a>
                  <a href="https://github.com/itsAyush5" target="_blank" rel="noopener noreferrer" className="btn" style={{ flex: 1, justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', fontSize: '0.85rem' }}>
                    <Github size={14} /> GitHub
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              <FeatureCard icon={Layers} title="Smart Conversion" desc="Automatic detection of 100+ formats with context-aware quality optimization." />
              <FeatureCard icon={Cpu} title="Native Processing" desc="No 3rd party APIs for core tools. Everything runs on our proprietary backend nodes." />
              <FeatureCard icon={Globe} title="Web-First Access" desc="Built as a high-performance PWA, usable on any device, anywhere." />
              <FeatureCard icon={Award} title="Enterprise Quality" desc="Lossless compression and high-fidelity text extraction for PDFs and documents." />
              <FeatureCard icon={Code} title="Developer Ready" desc="Robust API keys and documentation for seamless programmatic integration." />
              <FeatureCard icon={Heart} title="Community Driven" desc="Regular updates based on user feedback and open-source contributions." />
            </div>
          </motion.div>
        )}

        {activeTab === 'api' && (
          <motion.div
            key="api"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ marginTop: '-4rem' }}>
              <Documentation />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavPill({ active, label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.85rem 1.75rem', borderRadius: '99px', border: '1px solid transparent',
        background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
        color: active ? 'white' : 'rgba(255,255,255,0.4)',
        fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 0 20px rgba(99,102,241,0.15)' : 'none',
        borderColor: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)'
      }}
      onMouseEnter={e => { if(!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
    >
      <Icon size={18} color={active ? '#818cf8' : 'currentColor'} />
      {label}
    </button>
  );
}

function ValueProp({ icon: Icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', padding: '1rem', borderRadius: '16px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color="#6366f1" />
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', color: 'white', fontSize: '1.05rem' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="card" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-5px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <Icon size={24} color="#6366f1" />
      </div>
      <h3 style={{ margin: '0 0 0.75rem 0', color: 'white', fontSize: '1.25rem' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function StatItem({ label, val }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc' }}>{val}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}
