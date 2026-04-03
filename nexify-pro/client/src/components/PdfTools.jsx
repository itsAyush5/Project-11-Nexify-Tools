import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, GitMerge, Scissors, RotateCw, Trash2, FileOutput, FilePlus, X, Plus, ArrowUp, ArrowDown, Lock, Unlock, PenTool, Shield } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const tools = [
  { id: 'merge',   icon: GitMerge,   label: 'Merge PDFs',      color: '#6366f1', desc: 'Combine multiple PDFs into one file' },
  { id: 'split',   icon: Scissors,   label: 'Split PDF',       color: '#8b5cf6', desc: 'Divide a PDF into multiple files by page ranges' },
  { id: 'rotate',  icon: RotateCw,   label: 'Rotate Pages',    color: '#ec4899', desc: 'Rotate specific pages or the whole document' },
  { id: 'delete',  icon: Trash2,     label: 'Delete Pages',    color: '#ef4444', desc: 'Remove specific pages from a PDF' },
  { id: 'extract', icon: FileOutput, label: 'Extract Pages',   color: '#f59e0b', desc: 'Pull specific pages into a new PDF' },
  { id: 'insert',  icon: FilePlus,   label: 'Insert Pages',    color: '#22c55e', desc: 'Insert pages from another PDF at a chosen position' },
  { id: 'protect', icon: Lock,       label: 'Protect PDF',     color: '#f43f5e', desc: 'Add password protection to your PDF' },
  { id: 'unlock',  icon: Unlock,     label: 'Unlock PDF',      color: '#fbbf24', desc: 'Remove password protection from a PDF' },
  { id: 'sign',    icon: PenTool,    label: 'Sign PDF',        color: '#8b5cf6', desc: 'Place a signature image on any page' },
  { id: 'esign',   icon: Shield,     label: 'eSign',           color: '#10b981', desc: 'Draw and place your digital signature' },
];

function DropZone({ label, onFile, file, multiple = false }) {
  const ref = useRef(null);
  return (
    <div
      onClick={() => ref.current.click()}
      style={{
        border: '2px dashed rgba(99,102,241,0.4)',
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: 'rgba(99,102,241,0.05)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
    >
      <Upload size={24} color="#6366f1" style={{ marginBottom: '0.5rem' }} />
      {file
        ? <p style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>
            {Array.isArray(file) ? `${file.length} file(s) selected` : file.name}
          </p>
        : <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>{label}</p>
      }
      <input
        ref={ref}
        type="file"
        accept=".pdf"
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={e => onFile(multiple ? Array.from(e.target.files) : e.target.files[0])}
      />
    </div>
  );
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

async function postForm(endpoint, formData) {
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.blob();
}

// ─── Tool Panels ─────────────────────────────────────────────────────────────

function MergeTool() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  const addFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = ''; // ← reset so the same file or more files can be picked again
  };
  const remove = (i) => setFiles(f => f.filter((_, idx) => idx !== i));
  const moveUp = (i) => setFiles(f => { const a = [...f]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  const moveDown = (i) => setFiles(f => { const a = [...f]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });

  const run = async () => {
    if (files.length < 2) { setError('Add at least 2 PDFs'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const blob = await postForm('/pdf/merge', fd);
      downloadBlob(blob, 'merged.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div>
      {/* Drop zone — click to add more files each time */}
      <div
        style={{ border: '2px dashed rgba(99,102,241,0.4)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(99,102,241,0.05)', marginBottom: '1rem' }}
        onClick={() => ref.current.click()}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
      >
        <Plus size={20} color="#6366f1" />
        <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
          {files.length === 0 ? 'Click to add PDF files' : `Click to add more PDFs (${files.length} added so far)`}
        </span>
        <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '0.3rem', marginBottom: 0 }}>You can select multiple files at once or click repeatedly to add more</p>
        <input
          ref={ref}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
          onChange={addFiles}
        />
      </div>

      {/* File list with reorder controls */}
      {files.length === 0 && (
        <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>No files added yet — add at least 2 PDFs to merge</p>
      )}
      {files.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '0.5rem' }}>
          <span style={{ opacity: 0.5, fontSize: '0.8rem', minWidth: '1.2rem' }}>{i + 1}</span>
          <span style={{ flex: 1, fontSize: '0.85rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
          <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? '#444' : '#a5b4fc', cursor: i === 0 ? 'default' : 'pointer', padding: '2px' }}><ArrowUp size={14}/></button>
          <button onClick={() => moveDown(i)} disabled={i === files.length - 1} style={{ background: 'none', border: 'none', color: i === files.length - 1 ? '#444' : '#a5b4fc', cursor: i === files.length - 1 ? 'default' : 'pointer', padding: '2px' }}><ArrowDown size={14}/></button>
          <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}><X size={14}/></button>
        </div>
      ))}

      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
      <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={run} disabled={busy || files.length < 2}>
        {busy ? 'Merging...' : <><GitMerge size={16}/> Merge {files.length} PDFs into 1</>}
      </button>
    </div>
  );
}

function SplitTool() {
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState('1-3');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file) { setError('Select a PDF'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const rangeList = ranges.split(',').map(r => r.trim()).filter(Boolean);
      fd.append('ranges', JSON.stringify(rangeList));
      const blob = await postForm('/pdf/split', fd);
      downloadBlob(blob, 'split-part1.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF to split" onFile={setFile} file={file} />
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Page ranges (comma-separated, e.g. "1-3, 5, 7-9")</label>
        <input type="text" value={ranges} onChange={e => setRanges(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Splitting...' : <><Scissors size={16}/> Split PDF</>}
      </button>
    </div>
  );
}

function RotateTool() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('all');
  const [deg, setDeg] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file) { setError('Select a PDF'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pages', pages);
      fd.append('degrees', deg);
      const blob = await postForm('/pdf/rotate', fd);
      downloadBlob(blob, 'rotated.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF to rotate" onFile={setFile} file={file} />
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Pages ("all" or e.g. "1, 3-5")</label>
        <input type="text" value={pages} onChange={e => setPages(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[90, 180, 270].map(d => (
          <button key={d} onClick={() => setDeg(d)}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: `1px solid ${deg === d ? '#6366f1' : 'rgba(255,255,255,0.15)'}`, background: deg === d ? 'rgba(99,102,241,0.2)' : 'transparent', color: deg === d ? '#a5b4fc' : '#fff', cursor: 'pointer', fontWeight: deg === d ? 700 : 400 }}>
            {d}°
          </button>
        ))}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Rotating...' : <><RotateCw size={16}/> Rotate Pages</>}
      </button>
    </div>
  );
}

function PageRangeTool({ toolId, icon: Icon, label, endpoint, outputName }) {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !pages) { setError('Select a PDF and enter page numbers'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pages', pages);
      const blob = await postForm(endpoint, fd);
      downloadBlob(blob, outputName);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF" onFile={setFile} file={file} />
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Pages (e.g. "1, 3, 5-7")</label>
        <input type="text" value={pages} onChange={e => setPages(e.target.value)} placeholder="1, 3, 5-7"
          style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Processing...' : <><Icon size={16}/> {label}</>}
      </button>
    </div>
  );
}

function InsertTool() {
  const [base, setBase] = useState(null);
  const [insert, setInsert] = useState(null);
  const [position, setPosition] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!base || !insert) { setError('Select both PDF files'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('base', base);
      fd.append('insert', insert);
      fd.append('position', position);
      const blob = await postForm('/pdf/insert', fd);
      downloadBlob(blob, 'with-inserted-pages.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Base PDF</label>
        <DropZone label="Upload base PDF" onFile={setBase} file={base} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>PDF to Insert</label>
        <DropZone label="Upload PDF to insert" onFile={setInsert} file={insert} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Insert after page number</label>
        <input type="number" min="0" value={position} onChange={e => setPosition(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Inserting...' : <><FilePlus size={16}/> Insert Pages</>}
      </button>
    </div>
  );
}

function ProtectTool() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !password) { setError('Select a PDF and enter a password'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('password', password);
      const blob = await postForm('/pdf/protect', fd);
      downloadBlob(blob, 'protected.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF" onFile={setFile} file={file} />
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Set Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password..."
          style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Protecting...' : <><Lock size={16}/> Protect PDF</>}
      </button>
    </div>
  );
}

function UnlockTool() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !password) { setError('Select a PDF and enter current password'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('password', password);
      const blob = await postForm('/pdf/unlock', fd);
      downloadBlob(blob, 'unlocked.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF" onFile={setFile} file={file} />
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Passowrd to Unlock</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password..."
          style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Unlocking...' : <><Unlock size={16}/> Unlock PDF</>}
      </button>
    </div>
  );
}

function SignTool() {
  const [file, setFile] = useState(null);
  const [signature, setSignature] = useState(null);
  const [page, setPage] = useState(1);
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !signature) { setError('Select a PDF and a signature image'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('signature', signature);
      fd.append('page', page);
      fd.append('x', x);
      fd.append('y', y);
      fd.append('width', 150);
      fd.append('height', 80);
      const blob = await postForm('/pdf/sign', fd);
      downloadBlob(blob, 'signed.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Target PDF</label>
        <DropZone label="Upload PDF to sign" onFile={setFile} file={file} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Signature Image (PNG/JPG)</label>
        <DropZone label="Upload signature" onFile={setSignature} file={signature} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Page</label>
          <input type="number" min="1" value={page} onChange={e => setPage(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>X (0-600)</label>
          <input type="number" value={x} onChange={e => setX(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Y (0-800)</label>
          <input type="number" value={y} onChange={e => setY(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Signing...' : <><PenTool size={16}/> Sign PDF</>}
      </button>
    </div>
  );
}

function ESignTool() {
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [page, setPage] = useState(1);
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const run = async () => {
    if (!file) { setError('Select a PDF'); return; }
    setBusy(true); setError('');
    try {
      const canvas = canvasRef.current;
      const signatureBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const fd = new FormData();
      fd.append('file', file);
      fd.append('signature', signatureBlob, 'signature.png');
      fd.append('page', page);
      fd.append('x', x);
      fd.append('y', y);
      fd.append('width', 150);
      fd.append('height', 80);
      const blob = await postForm('/pdf/sign', fd);
      downloadBlob(blob, 'esign-result.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF to eSign" onFile={setFile} file={file} />
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Draw Signature</label>
        <div style={{ background: '#000', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'crosshair', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            style={{ width: '100%', height: '150px' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <button onClick={clear} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Page</label>
          <input type="number" min="1" value={page} onChange={e => setPage(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>X Pos</label>
          <input type="number" value={x} onChange={e => setX(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Y Pos</label>
          <input type="number" value={y} onChange={e => setY(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Processing...' : <><Shield size={16}/> eSign & Download</>}
      </button>
    </div>
  );
}

// ─── Main PdfTools Component ──────────────────────────────────────────────────

export default function PdfTools() {
  const [active, setActive] = useState(null);

  const renderTool = () => {
    switch (active) {
      case 'merge':   return <MergeTool />;
      case 'split':   return <SplitTool />;
      case 'rotate':  return <RotateTool />;
      case 'delete':  return <PageRangeTool toolId="delete" icon={Trash2} label="Delete Pages" endpoint="/pdf/delete-pages" outputName="pages-deleted.pdf" />;
      case 'extract': return <PageRangeTool toolId="extract" icon={FileOutput} label="Extract Pages" endpoint="/pdf/extract-pages" outputName="extracted.pdf" />;
      case 'insert':  return <InsertTool />;
      case 'protect': return <ProtectTool />;
      case 'unlock':  return <UnlockTool />;
      case 'sign':    return <SignTool />;
      case 'esign':   return <ESignTool />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {tools.map(t => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActive(active === t.id ? null : t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem',
                padding: '1rem', borderRadius: '12px', border: `1px solid ${active === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: active === t.id ? `${t.color}22` : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', color: '#fff', textAlign: 'left', transition: 'all 0.2s',
              }}
            >
              <Icon size={22} color={t.color} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.label}</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.55 }}>{t.desc}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card"
            style={{ marginTop: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{tools.find(t => t.id === active)?.label}</h3>
              <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}><X size={18}/></button>
            </div>
            {renderTool()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
