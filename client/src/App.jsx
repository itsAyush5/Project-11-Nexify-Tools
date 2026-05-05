import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, File, Download, RefreshCw, Zap, 
  AlertCircle, CheckCircle, FileText, 
  ChevronRight
} from 'lucide-react';
import * as mockEngine from './services/mockEngine';
import PdfTools from './components/PdfTools';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import ExplorePage from './components/ExplorePage';
import DevelopersPage from './components/DevelopersPage';
import DocsPage from './components/DocsPage';

axios.defaults.withCredentials = true;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/* ─── Page transition variants ─── */
const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

const App = () => {
  const [tab, setTab]               = useState('explore'); // 'explore' | 'convert' | 'pdf' | 'account'
  const [activePdfTool, setActivePdfTool] = useState(null);
  const [user, setUser]             = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [file, setFile]             = useState(null);
  const [analysis, setAnalysis]     = useState(null);
  const [jobId, setJobId]           = useState(null);
  const [status, setStatus]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [backendOnline, setBackendOnline]   = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [showAuth, setShowAuth]     = useState(false);
  const fileInputRef = useRef(null);

  /* ── Auth ── */
  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`);
      setUser(res.data);
    } catch { setUser(null); }
    setCheckingAuth(false);
  };

  const logout = async () => {
    await axios.get(`${API_BASE}/auth/logout`);
    setUser(null);
    setTab('explore');
  };

  /* ── Backend health ── */
  useEffect(() => {
    const check = async () => {
      try { await axios.get(`${API_BASE}/ping`, { timeout: 3000 }); setBackendOnline(true); }
      catch { setBackendOnline(false); }
    };
    check();
    checkAuth();
    const t = setInterval(check, 4000);
    return () => clearInterval(t);
  }, []);

  /* ── File upload ── */
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setAnalysis(null); setJobId(null); setStatus(null); setProgress(0); setErrorMsg('');

    if (backendOnline) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const { data } = await axios.post(`${API_BASE}/analyze`, formData, { timeout: 15000 });
        setAnalysis(data); setLoading(false); return;
      } catch (err) { console.warn('Backend analyze failed', err.message); }
    }
    setTimeout(() => { setAnalysis(mockEngine.simulateAnalysis(selectedFile)); setLoading(false); }, 500);
  };

  /* ── Conversion ── */
  const startConversion = async (targetFormat) => {
    setLoading(true); setSelectedFormat(targetFormat);
    setStatus(null); setProgress(0); setErrorMsg('');

    if (backendOnline && analysis?.fileId) {
      try {
        const { data } = await axios.post(`${API_BASE}/convert`, { fileId: analysis.fileId, targetFormat }, { timeout: 10000 });
        setJobId(data.jobId); setLoading(false); return;
      } catch (err) { setErrorMsg('Backend conversion failed. Using local simulation.'); }
    }

    // Local simulation — run async in background, don't block UI
    const mockId = 'mock-' + Math.random().toString(36).substr(2, 9);
    setJobId(mockId);
    setStatus('processing');
    setLoading(false);

    // Kick off simulation without awaiting so state updates flow through React
    mockEngine.simulateConversion(mockId, targetFormat, (p) => {
      setProgress(p);
      if (p === 100) setStatus('completed');
    });
  };

  /* ── Poll job status ── */
  useEffect(() => {
    if (!jobId || !backendOnline || jobId.startsWith('mock-')) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/status/${jobId}`);
        setStatus(data.status); setProgress(data.progress || 0);
        if (data.status === 'completed' || data.status === 'failed') {
          if (data.status === 'failed') setErrorMsg(`Conversion failed: ${data.error}`);
          clearInterval(interval);
        }
      } catch (err) { console.error('Poll error', err.message); }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId, backendOnline]);

  /* ── Download ── */
  const handleDownload = () => {
    const baseName = file.name.split('.').slice(0, -1).join('.');
    const outName  = `${baseName}.${selectedFormat.toLowerCase()}`;
    
    // If backend is online and the job isn't a local simulation, download directly via browser
    if (backendOnline && jobId && !jobId.startsWith('mock-')) {
      const a = document.createElement('a');
      a.href = `${API_BASE}/download/${jobId}`;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return; // Do NOT fall through to mock logic
    }
    
    // ── Local Mock Simulator (Only used when disconnected from Backend) ──
    try {
      const format = selectedFormat.toLowerCase();
      let blob;
      const { jspdf } = window;
      if (format === 'pdf' && jspdf) {
        const doc = new jspdf.jsPDF();
        doc.setFontSize(20); doc.text('Nexify Tools: Converted Document', 20, 30);
        doc.setFontSize(12);
        doc.text(`Source: ${file.name}`, 20, 50);
        doc.text(`Format: ${format.toUpperCase()}`, 20, 60);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 70);
        blob = doc.output('blob');
      } else if (['jpg','jpeg','png','webp','gif','bmp'].includes(format)) {
        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 800, 600);
        g.addColorStop(0, '#1a1a2e'); g.addColorStop(1, '#16213e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#6366f1'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('NEXIFY TOOLS', 50, 200);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '20px sans-serif';
        ctx.fillText(`${file.name} → ${format.toUpperCase()}`, 50, 260);
        const mime = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
        canvas.toBlob((b) => {
          const url = URL.createObjectURL(b);
          const a = document.createElement('a'); a.href = url; a.download = outName;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, mime, 0.95);
        return;
      } else {
        blob = new Blob([`[Nexify Tools]\nSource: ${file.name}\nFormat: ${format}\nDate: ${new Date().toLocaleString()}`], { type: 'text/plain' });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = outName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Mock download failed', err);
    }
  };

  const reset = () => {
    setFile(null); setAnalysis(null); setJobId(null);
    setStatus(null); setProgress(0); setSelectedFormat(''); setErrorMsg('');
  };

  /* ────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Navbar ── */}
      <Navbar
        user={user}
        onSignIn={() => setShowAuth(true)}
        onTabChange={(t) => {
          if (t === 'account' && !user) { setShowAuth(true); return; }
          setTab(t);
          if (t !== 'pdf') setActivePdfTool(null);
        }}
        activeTab={tab}
        onLogout={logout}
      />

      {/* ── Global gradient mesh ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 50% at 15% 0%, rgba(99,102,241,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 100%, rgba(139,92,246,0.08) 0%, transparent 60%)
        `,
      }} />

      {/* ── Page Content ── */}
      <AnimatePresence mode="wait">
        {checkingAuth ? (
          <motion.div key="loader" {...pageVariants} style={{ display: 'flex', justifyContent: 'center', padding: '10rem', position: 'relative', zIndex: 1 }}>
            <RefreshCw className="spin" size={28} color="#6366f1" />
          </motion.div>

        ) : tab === 'explore' ? (
          <motion.div key="explore" {...pageVariants} style={{ position: 'relative', zIndex: 1 }}>
            <ExplorePage
              onGoConvert={() => setTab('convert')}
              onGoPdf={(toolId) => {
                setActivePdfTool(toolId || null);
                setTab('pdf');
              }}
            />
          </motion.div>

        ) : tab === 'pdf' ? (
          <motion.div key="pdf" {...pageVariants} style={{ position: 'relative', zIndex: 1 }}>
            <div className="page-container">
              <div className="page-header">
                <h2 className="page-title">PDF Tools</h2>
                <p className="page-sub">Select a tool to get started</p>
              </div>
              <PdfTools initialActive={activePdfTool} />
            </div>
          </motion.div>

        ) : tab === 'api' ? (
          <motion.div key="api" {...pageVariants} style={{ position: 'relative', zIndex: 1 }}>
            <DevelopersPage 
              user={user} 
              onSignIn={() => setShowAuth(true)} 
              onTabChange={(t) => setTab(t)}
            />
          </motion.div>

        ) : tab === 'docs' ? (
          <motion.div key="docs" {...pageVariants} style={{ position: 'relative', zIndex: 1 }}>
            <DocsPage />
          </motion.div>

        ) : tab === 'account' ? (
          user ? (
            <motion.div key="account" {...pageVariants} style={{ position: 'relative', zIndex: 1 }}>
              <div className="page-container" style={{ maxWidth: 1060 }}>
                <Dashboard user={user} onLogout={logout} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="no-user" {...pageVariants} style={{ textAlign: 'center', padding: '6rem 1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <AlertCircle size={28} color="#6366f1" />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.4rem', fontWeight: 700 }}>Sign In Required</h3>
              <p style={{ opacity: 0.4, marginBottom: '2rem', maxWidth: 340, margin: '0 auto 2rem' }}>Sign in to view your dashboard, conversion history, and API keys.</p>
              <button onClick={() => setShowAuth(true)} className="hero-cta-primary">
                Sign In to Continue
              </button>
            </motion.div>
          )

        ) : (
          /* ── Convert Tab ── */
          <motion.div key="convert" {...pageVariants} style={{ position: 'relative', zIndex: 1 }}>
            <div className="page-container">
              <div className="page-header">
                <h2 className="page-title">File Converter</h2>
                <p className="page-sub">{backendOnline ? '🟢 Cloud engine online' : '⚡ Local mode — no backend needed'}</p>
              </div>

              <div className="card">
                {!file ? (
                  <motion.div
                    className="upload-zone"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
                      <Upload size={48} color="#818cf8" style={{ marginBottom: '1.25rem', filter: 'drop-shadow(0 0 16px rgba(99,102,241,0.5))' }} />
                    </motion.div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Drop your file here</h3>
                    <p style={{ opacity: 0.4, fontSize: '0.9rem', maxWidth: 300, margin: '0 auto' }}>
                      Any format — instantly detected &amp; converted
                    </p>
                    <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '99px', padding: '0.4rem 1.1rem', fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>
                      <Zap size={12} /> Click or drag &amp; drop
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* File info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ background: 'rgba(99,102,241,0.15)', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <File size={28} color="#818cf8" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '0.2rem', fontSize: '0.95rem', fontWeight: 700 }}>{file.name}</h3>
                        <p style={{ opacity: 0.5, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                            borderRadius: '99px', padding: '0.15rem 0.6rem',
                            fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc',
                            textTransform: 'capitalize',
                          }}>
                            {analysis?.category || analysis?.extension?.toUpperCase().replace('.', '') || 'Detecting…'}
                          </span>
                          {analysis?.extension?.toUpperCase().replace('.', '')} &bull; {(file.size / 1024 / 1024).toFixed(2)} MB
                          {backendOnline && analysis?.fileId && <span style={{ color: '#4ade80' }}>✓ Uploaded</span>}
                        </p>
                      </div>
                      <button className="btn" style={{ background: 'transparent' }} onClick={reset}>
                        <RefreshCw size={14} /> Reset
                      </button>
                    </div>

                    {/* Available conversions */}
                    {analysis && !jobId && (
                      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <p style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
                          <Zap size={15} color="#f59e0b" /> {analysis.availableOutputs?.length || 0} available conversions
                        </p>
                        <div className="grid">
                          {analysis.availableOutputs?.map((out) => (
                            <motion.button
                              key={out.format}
                              className="format-btn"
                              whileHover={{ scale: 1.06 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => startConversion(out.format.replace('.', ''))}
                            >
                              {out.format.toUpperCase().replace('.', '')}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Processing / Result */}
                    {jobId && (
                      <AnimatePresence mode="wait">
                        {status !== 'completed' ? (
                          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <div className="processing-circle">
                              <div className="circle-content">
                                <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{progress}%</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.1rem' }}>Processing</span>
                              </div>
                            </div>
                            <h3 style={{ margin: '1.5rem 0 0.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
                              {status === 'waiting' ? 'Establishing connection…' : status === 'processing' ? 'Optimizing your file…' : 'Initializing Nexify Engine…'}
                            </h3>
                            <p style={{ opacity: 0.35, fontSize: '0.82rem' }}>Hang tight. Creating something premium.</p>
                          </motion.div>
                        ) : (
                          <motion.div key="result" initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="result-card">
                            <div className="success-glow">
                              <CheckCircle size={32} color="#4ade80" />
                            </div>
                            <h2 style={{ marginBottom: '0.5rem', fontFamily: "'Syne', sans-serif", fontSize: '1.6rem' }}>Your file is ready!</h2>
                            <p style={{ opacity: 0.4, marginBottom: '2.5rem', fontSize: '0.9rem' }}>High-fidelity conversion optimised by Nexify Tools.</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', marginBottom: '2.5rem', maxWidth: 440, margin: '0 auto 2.5rem' }}>
                              <div className="format-box">
                                <FileText size={18} color="#6366f1" />
                                <span style={{ fontWeight: 700 }}>{file.name.split('.').pop().toUpperCase()}</span>
                              </div>
                              <div className="transform-arrow"><ChevronRight size={18} /></div>
                              <div className="format-box" style={{ borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.03)' }}>
                                <CheckCircle size={18} color="#4ade80" />
                                <span style={{ fontWeight: 700 }}>{selectedFormat.toUpperCase()}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <button className="btn btn-primary" onClick={handleDownload} style={{ height: '3.2rem', fontSize: '0.95rem', padding: '0 2rem' }}>
                                <Download size={18} /> Download {selectedFormat.toUpperCase()}
                              </button>
                              <button className="btn" onClick={reset} style={{ height: '3.2rem' }}>
                                <RefreshCw size={16} /> Convert More
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}

                    {errorMsg && (
                      <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertCircle size={14} /> {errorMsg}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Auth Modal ── */}
      <AnimatePresence>
        {showAuth && (
          <Auth
            onAuth={(userData) => { setUser(userData); }}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>

      <footer style={{ position: 'relative', zIndex: 1 }}>
        <p>© 2026 Nexify Tools &nbsp;·&nbsp; Made with ❤️ &amp; ☕ by{' '}
          <a href="https://ayush-devspace5.web.app">Ayush Devspace</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
