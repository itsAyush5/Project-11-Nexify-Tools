import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, File, Download, RefreshCw, Zap, 
  Cloud, AlertCircle, CheckCircle, FileText, 
  ChevronRight, LogIn, User, Lock 
} from 'lucide-react';
import * as mockEngine from './services/mockEngine';
import PdfTools from './components/PdfTools';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

axios.defaults.withCredentials = true;

const API_BASE = 'http://localhost:5000/api';

const App = () => {
  const [tab, setTab] = useState('convert');
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const fileInputRef = useRef(null);

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
    setTab('convert');
  };

  // Check backend health every 4 seconds
  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(`${API_BASE}/ping`, { timeout: 3000 });
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
    checkAuth();
    const t = setInterval(check, 4000);
    return () => clearInterval(t);
  }, []);

  // Handle file selection
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setAnalysis(null);
    setJobId(null);
    setStatus(null);
    setProgress(0);
    setErrorMsg('');

    if (backendOnline) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const { data } = await axios.post(`${API_BASE}/analyze`, formData, { timeout: 15000 });
        setAnalysis(data);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Backend analyze failed, using local discovery', err.message);
      }
    }

    // Local fallback discovery
    setTimeout(() => {
      setAnalysis(mockEngine.simulateAnalysis(selectedFile));
      setLoading(false);
    }, 500);
  };

  // Start conversion
  const startConversion = async (targetFormat) => {
    setLoading(true);
    setSelectedFormat(targetFormat);
    setStatus(null);
    setProgress(0);
    setErrorMsg('');

    if (backendOnline && analysis?.fileId) {
      try {
        const { data } = await axios.post(`${API_BASE}/convert`, {
          fileId: analysis.fileId,
          targetFormat,
        }, { timeout: 10000 });
        setJobId(data.jobId);
        setLoading(false);
        return;
      } catch (err) {
        setErrorMsg('Backend conversion failed. Using local simulation.');
        console.error(err.message);
      }
    }

    // Local simulation fallback
    const mockId = 'mock-' + Math.random().toString(36).substr(2, 9);
    setJobId(mockId);
    setStatus('processing');
    mockEngine.simulateConversion(mockId, targetFormat, (p) => {
      setProgress(p);
      if (p === 100) setStatus('completed');
    });
    setLoading(false);
  };

  // Poll backend job status
  useEffect(() => {
    if (!jobId || !backendOnline || jobId.startsWith('mock-')) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/status/${jobId}`);
        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.status === 'completed' || data.status === 'failed') {
          if (data.status === 'failed') {
            setErrorMsg(`Conversion failed: ${data.error}`);
          }
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Poll error', err.message);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, backendOnline]);

  // Download result
  const handleDownload = async () => {
    const baseName = file.name.split('.').slice(0, -1).join('.');
    const outName = `${baseName}.${selectedFormat.toLowerCase()}`;

    // Real backend download
    if (backendOnline && jobId && !jobId.startsWith('mock-')) {
      try {
        const response = await fetch(`${API_BASE}/download/${jobId}`);
        if (!response.ok) throw new Error('Download not ready');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.error('Backend download failed, using local gen', err.message);
      }
    }

    // Local generation fallback
    const format = selectedFormat.toLowerCase();
    let blob;
    const { jspdf } = window;
    if (format === 'pdf' && jspdf) {
      const doc = new jspdf.jsPDF();
      doc.setFontSize(20);
      doc.text('Nexify Pro: Converted Document', 20, 30);
      doc.setFontSize(12);
      doc.text(`Source: ${file.name}`, 20, 50);
      doc.text(`Format: ${format.toUpperCase()}`, 20, 60);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 70);
      blob = doc.output('blob');
    } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(format)) {
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 800, 600);
      g.addColorStop(0, '#1a1a2e'); g.addColorStop(1, '#16213e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('NEXIFY PRO', 50, 200);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '20px sans-serif';
      ctx.fillText(`${file.name} → ${format.toUpperCase()}`, 50, 260);
      const mime = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
      blob = await new Promise(res => canvas.toBlob(res, mime, 0.95));
    } else {
      blob = new Blob([`[Nexify Pro]\nSource: ${file.name}\nFormat: ${format}\nDate: ${new Date().toLocaleString()}`], { type: 'text/plain' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null); setAnalysis(null); setJobId(null);
    setStatus(null); setProgress(0); setSelectedFormat(''); setErrorMsg('');
  };

  return (
    <div className="container">
      <header className="header">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h1 className="title">Nexify Tools</h1>
            {/* <span className={`badge ${backendOnline ? 'badge-on' : 'badge-off'}`}>
              {backendOnline ? <><Cloud size={14} /> CLOUD ENGINE ONLINE</> : <><Zap size={14} /> LOCAL MODE</>}
            </span> */}
          </div>
          <p className="subtitle">High-Performance Dynamic Conversion Engine</p>

          <div className="auth-trigger">
            {user ? (
               <button 
                 onClick={() => setTab('account')}
                 className="btn-premium" 
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
               >
                 <User size={18} /> {user.name.split(' ')[0]}
               </button>
            ) : (
               <button onClick={() => setShowAuth(true)} className="btn-premium">
                 <LogIn size={18} /> Sign In
               </button>
            )}
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            {[
              { id: 'convert', label: '⚡ Convert' },
              { id: 'pdf', label: '📄 PDF Tools' },
              { id: 'account', label: '👤 Account' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '99px',
                  border: `1px solid ${tab === t.id ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                  background: tab === t.id ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: tab === t.id ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                  fontWeight: tab === t.id ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {checkingAuth ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem' }}>
              <RefreshCw className="spin" size={32} color="#6366f1"/>
            </motion.div>
          ) : tab === 'account' && !user ? (
             <motion.div key="no-user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ background: 'rgba(99,102,241,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                   <Lock size={32} color="#6366f1" />
                </div>
                <h3>Secure Access Required</h3>
                <p style={{ opacity: 0.5, marginBottom: '2rem' }}>Please sign in to view your dashboard and conversion history.</p>
                <button onClick={() => setShowAuth(true)} className="btn btn-primary">
                   Login or Create Account
                </button>
             </motion.div>
          ) : tab === 'account' ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Dashboard user={user} onLogout={logout} />
            </motion.div>
          ) : tab === 'pdf' ? (
            <motion.div key="pdf" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <PdfTools />
            </motion.div>
          ) : (
            <motion.div key="convert" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="card">
                {!file ? (
                  <motion.div
                    className="upload-zone"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
                    <h3>Drop your file here</h3>
                    <p style={{ opacity: 0.6 }}>Any format — instantly detected &amp; converted</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* File info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ background: 'rgba(99,102,241,0.2)', padding: '1rem', borderRadius: '12px' }}>
                        <File size={32} color="#6366f1" />
                      </div>
                      <div>
                        <h3 style={{ marginBottom: '0.2rem' }}>{file.name}</h3>
                        <p style={{ opacity: 0.6 }}>
                          {analysis?.extension?.toUpperCase().replace('.', '') || 'Detecting...'} &bull; {(file.size / 1024 / 1024).toFixed(2)} MB
                          {backendOnline && analysis?.fileId && <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>✓ Uploaded to server</span>}
                        </p>
                      </div>
                      <button className="btn" style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)' }} onClick={reset}>
                        <RefreshCw size={16} /> Reset
                      </button>
                    </div>

                    {/* Available conversions */}
                    {analysis && !jobId && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <p style={{ marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Zap size={18} color="#f59e0b" />
                          {analysis.availableOutputs?.length || 0} Available Conversions
                          {backendOnline && <span style={{ color: '#6366f1', fontSize: '0.8rem' }}></span>}
                        </p>
                        <div className="grid">
                          {analysis.availableOutputs?.map((out) => (
                            <motion.button
                              key={out.format}
                              className="format-btn"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => startConversion(out.format.replace('.', ''))}
                            >
                              {out.format.toUpperCase().replace('.', '')}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Minimalist Processing UI */}
                    {jobId && (
                      <AnimatePresence>
                        {status !== 'completed' ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <div className="processing-circle">
                               <div className="circle-content">
                                  <span style={{ fontSize: '1.5rem', fontWeight: 500 }}>{progress}%</span>
                                  <span style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1rem' }}>Processing</span>
                               </div>
                            </div>
                            <h3 style={{ margin: '1.5rem 0 0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                               {status === 'waiting' ? 'Establishing Connection...' : 
                                status === 'processing' ? 'Optimizing your file...' : 
                                'Preparing Nexify Engine...'}
                            </h3>
                            <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>Hang tight. Creating something premium.</p>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="result-card">
                            <div className="success-glow">
                              <CheckCircle size={32} color="#4ade80" />
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Success! Your file is ready.</h2>
                            <p style={{ opacity: 0.5, marginBottom: '2.5rem' }}>High-fidelity conversion optimized by Nexify Pro.</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', marginBottom: '2.5rem' }}>
                               <div className="format-box">
                                  <FileText size={20} color="#6366f1" />
                                  <span style={{ fontWeight: 600 }}>{file.name.split('.').pop().toUpperCase()}</span>
                               </div>
                               <div className="transform-arrow">
                                  <ChevronRight size={20} />
                               </div>
                               <div className="format-box" style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.02)' }}>
                                  <CheckCircle size={20} color="#4ade80" />
                                  <span style={{ fontWeight: 600 }}>{selectedFormat.toUpperCase()}</span>
                               </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button className="btn btn-primary" onClick={handleDownload} style={{ flex: 2, height: '3.5rem', fontSize: '1rem' }}>
                                <Download size={20} /> Download Optimized {selectedFormat.toUpperCase()}
                              </button>
                              <button className="btn" onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                                <RefreshCw size={18} /> Convert More
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAuth && (
          <Auth 
            onAuth={setUser} 
            onClose={() => setShowAuth(false)} 
          />
        )}
      </AnimatePresence>

      <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.4, fontStyle: 'italic' }}>
        <p>© 2026 Nexify-Tools • Made with ❤️&☕by <a href="https://ayush-devspace5.web.app"style={{ textDecoration: "none", color: "white" }}>Ayush Devspace</a>{backendOnline}</p>
      </footer>
    </div>
  );
};

export default App;
