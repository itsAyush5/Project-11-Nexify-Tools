import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Download, GitMerge, Scissors, RotateCw, Trash2, FileOutput, FilePlus, 
  X, Plus, ArrowUp, ArrowDown, Lock, Unlock, PenTool, Shield, FileImage, 
  Droplet, ListOrdered, Tags, Layers, Minimize2, FlipVertical, Copy, 
  PlusSquare, Crop, AlignCenter, ChevronRight, Search, Sparkles, FileText,
  ShieldCheck, Layout, Activity, Info, RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const categories = [
  { id: 'all', label: 'All Tools', icon: Layout },
  { id: 'edit', label: 'Edit & Modify', icon: Scissors },
  { id: 'security', label: 'Security & Forms', icon: ShieldCheck },
  { id: 'signing', label: 'Signing', icon: PenTool },
  { id: 'optimize', label: 'Optimization', icon: Activity },
];

const tools = [
  // Edit & Modify
  { id: 'merge',   icon: GitMerge,   label: 'Merge PDFs',      color: '#6366f1', cat: 'edit', desc: 'Combine multiple PDFs into one file' },
  { id: 'split',   icon: Scissors,   label: 'Split PDF',       color: '#8b5cf6', cat: 'edit', desc: 'Divide a PDF into multiple files by page ranges' },
  { id: 'rotate',  icon: RotateCw,   label: 'Rotate Pages',    color: '#ec4899', cat: 'edit', desc: 'Rotate specific pages or the whole document' },
  { id: 'delete',  icon: Trash2,     label: 'Delete Pages',    color: '#ef4444', cat: 'edit', desc: 'Remove specific pages from a PDF' },
  { id: 'extract', icon: FileOutput, label: 'Extract Pages',   color: '#f59e0b', cat: 'edit', desc: 'Pull specific pages into a new PDF' },
  { id: 'insert',  icon: FilePlus,   label: 'Insert Pages',    color: '#22c55e', cat: 'edit', desc: 'Insert pages from another PDF at a chosen position' },
  { id: 'reverse',    icon: FlipVertical, label: 'Reverse Pages',   color: '#a855f7', cat: 'edit', desc: 'Flip the entire page order of a PDF' },
  { id: 'duplicate',  icon: Copy,         label: 'Duplicate Pages', color: '#06b6d4', cat: 'edit', desc: 'Clone specific pages and append them' },
  { id: 'blank',      icon: PlusSquare,   label: 'Add Blank Page',  color: '#f59e0b', cat: 'edit', desc: 'Insert an empty page at any position' },
  { id: 'crop',       icon: Crop,         label: 'Crop Pages',      color: '#f43f5e', cat: 'edit', desc: 'Trim margins from all pages' },
  
  // Security
  { id: 'protect', icon: Lock,       label: 'Protect PDF',     color: '#f43f5e', cat: 'security', desc: 'Add password protection to your PDF' },
  { id: 'unlock',  icon: Unlock,     label: 'Unlock PDF',      color: '#fbbf24', cat: 'security', desc: 'Remove password protection from a PDF' },
  { id: 'flatten',    icon: Layers,       label: 'Flatten PDF',     color: '#ef4444', cat: 'security', desc: 'Lock interactive forms so they are uneditable' },
  
  // Signing
  { id: 'sign',    icon: PenTool,    label: 'Sign PDF',        color: '#8b5cf6', cat: 'signing', desc: 'Place a signature image on any page' },
  { id: 'esign',   icon: Shield,     label: 'eSign',           color: '#10b981', cat: 'signing', desc: 'Draw and place your digital signature' },
  
  // Optimize & Tools
  { id: 'compress',   icon: Minimize2,    label: 'Compress PDF',    color: '#22c55e', cat: 'optimize', desc: 'Reduce file size with object stream compression' },
  { id: 'watermark', icon: Droplet,  label: 'Watermark',       color: '#06b6d4', cat: 'optimize', desc: 'Add a diagonal text watermark across all pages' },
  { id: 'numbers', icon: ListOrdered,label: 'Page Numbers',    color: '#8b5cf6', cat: 'optimize', desc: 'Automatically add page numbers to the bottom' },
  { id: 'metadata',icon: Tags,       label: 'Metadata',        color: '#eab308', cat: 'optimize', desc: 'Edit the internal properties (Title, Author, etc.)' },
  { id: 'headerfooter', icon: AlignCenter,label: 'Header & Footer', color: '#10b981', cat: 'optimize', desc: 'Add text header and/or footer to all pages' },
];

// ─── Utility Components ───────────────────────────────────────────────────────

function DropZone({ label, onFile, file, multiple = false, accept = ".pdf" }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = multiple ? Array.from(e.dataTransfer.files) : e.dataTransfer.files[0];
        if (dropped) onFile(dropped);
      }}
      style={{
        border: `2px dashed ${dragging ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(99,102,241,0.05) 0%, transparent 70%)', opacity: dragging ? 1 : 0, transition: 'opacity 0.3s' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Upload size={22} color="#818cf8" />
        </div>
        {file ? (
          <div>
            <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              {Array.isArray(file) ? `${file.length} Files Selected` : file.name}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Click or drag to replace</p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>{label}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Drag & drop or click to browse</p>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={e => onFile(multiple ? Array.from(e.target.files) : e.target.files[0])}
      />
    </motion.div>
  );
}

function ToolInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: '1.25rem', flex: 1 }}>
      {label && <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.6rem', marginLeft: '0.4rem' }}>{label}</label>}
      <input
        {...props}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          color: '#fff',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'all 0.2s',
          ...props.style
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
      />
    </div>
  );
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function postForm(endpoint, formData) {
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.blob();
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Tool Panels ─────────────────────────────────────────────────────────────

function MergeTool() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (selected) => {
    const newFiles = Array.isArray(selected) ? selected : [selected];
    setFiles(prev => [...prev, ...newFiles]);
  };
  const remove = (i) => setFiles(f => f.filter((_, idx) => idx !== i));
  const moveUp = (i) => setFiles(f => { const a = [...f]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  const moveDown = (i) => setFiles(f => { const a = [...f]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });

  const run = async () => {
    if (files.length < 2) { setError('Add at least 2 PDFs to merge'); return; }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label="Add PDFs to Merge" onFile={addFiles} file={files.length > 0 ? files : null} multiple />
      
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>File Sequence ({files.length} files)</p>
          <AnimatePresence initial={false}>
            {files.map((f, i) => (
              <motion.div
                key={`${f.name}-${i}`}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{i + 1}</div>
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <div style={{ display: 'flex', gap: '0.1rem' }}>
                  <button onClick={() => moveUp(i)} disabled={i === 0} style={{ padding: '0.4rem', background: 'none', border: 'none', color: i === 0 ? 'rgba(255,255,255,0.1)' : '#818cf8', cursor: 'pointer' }}><ArrowUp size={14}/></button>
                  <button onClick={() => moveDown(i)} disabled={i === files.length - 1} style={{ padding: '0.4rem', background: 'none', border: 'none', color: i === files.length - 1 ? 'rgba(255,255,255,0.1)' : '#818cf8', cursor: 'pointer' }}><ArrowDown size={14}/></button>
                  <button onClick={() => remove(i)} style={{ padding: '0.4rem', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={14}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || files.length < 2}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><GitMerge size={18} /> Merge {files.length} PDFs</>}
      </button>
    </div>
  );
}

function RangeBasedTool({ icon: Icon, label, endpoint, outputName, placeholder = "e.g. 1, 3, 5-7" }) {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !pages) { setError('Please select a file and specify pages'); return; }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label={`Upload PDF to ${label}`} onFile={setFile} file={file} />
      <ToolInput label="Page Range" placeholder={placeholder} value={pages} onChange={e => setPages(e.target.value)} />
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><Icon size={18} /> {label}</>}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label="Upload PDF to Rotate" onFile={setFile} file={file} />
      <ToolInput label="Pages (e.g. all, 1, 3-5)" value={pages} onChange={e => setPages(e.target.value)} />
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        {[90, 180, 270].map(d => (
          <button key={d} onClick={() => setDeg(d)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: `1px solid ${deg === d ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, background: deg === d ? 'rgba(99,102,241,0.1)' : 'transparent', color: deg === d ? '#a5b4fc' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
            {d}°
          </button>
        ))}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><RotateCw size={18} /> Rotate PDF</>}
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
    if (!base || !insert) { setError('Select both PDFs'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('base', base);
      fd.append('insert', insert);
      fd.append('position', position);
      const blob = await postForm('/pdf/insert', fd);
      downloadBlob(blob, 'inserted.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label="Base PDF" onFile={setBase} file={base} />
      <DropZone label="PDF to Insert" onFile={setInsert} file={insert} />
      <ToolInput label="Insert after page number" type="number" min="0" value={position} onChange={e => setPosition(e.target.value)} />
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !base || !insert}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><FilePlus size={18} /> Insert Pages</>}
      </button>
    </div>
  );
}

function PasswordTool({ type = 'protect' }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !password) { setError('File and password required'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('password', password);
      const blob = await postForm(`/pdf/${type}`, fd);
      downloadBlob(blob, type === 'protect' ? 'protected.pdf' : 'unlocked.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label={`Upload PDF to ${type}`} onFile={setFile} file={file} />
      <ToolInput label={type === 'protect' ? "Set Password" : "Unlock Password"} type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file}>
        {busy ? <RefreshCw className="spin" size={18} /> : type === 'protect' ? <><Lock size={18} /> Protect PDF</> : <><Unlock size={18} /> Unlock PDF</>}
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
    if (!file || !signature) { setError('PDF and signature image required'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('signature', signature);
      fd.append('page', page);
      fd.append('x', x); fd.append('y', y);
      fd.append('width', 150); fd.append('height', 80);
      const blob = await postForm('/pdf/sign', fd);
      downloadBlob(blob, 'signed.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DropZone label="Target PDF" onFile={setFile} file={file} />
      <DropZone label="Signature (PNG/JPG)" onFile={setSignature} file={signature} accept="image/*" />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <ToolInput label="Page" type="number" value={page} onChange={e => setPage(e.target.value)} />
        <ToolInput label="X Pos" type="number" value={x} onChange={e => setX(e.target.value)} />
        <ToolInput label="Y Pos" type="number" value={y} onChange={e => setY(e.target.value)} />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file || !signature}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><PenTool size={18} /> Sign PDF</>}
      </button>
    </div>
  );
}


function WatermarkTool() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file || !text) { setError('File and text required'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('text', text);
      const blob = await postForm('/pdf/watermark', fd);
      downloadBlob(blob, 'watermarked.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label="Upload PDF to Watermark" onFile={setFile} file={file} />
      <ToolInput label="Watermark Text" placeholder="e.g. CONFIDENTIAL" value={text} onChange={e => setText(e.target.value)} />
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><Droplet size={18} /> Add Watermark</>}
      </button>
    </div>
  );
}

function MetadataTool() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file) { setError('Select a PDF'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (title) fd.append('title', title);
      if (author) fd.append('author', author);
      if (subject) fd.append('subject', subject);
      if (keywords) fd.append('keywords', keywords);
      const blob = await postForm('/pdf/metadata', fd);
      downloadBlob(blob, 'metadata.pdf');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DropZone label="Upload PDF" onFile={setFile} file={file} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <ToolInput label="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <ToolInput label="Author" value={author} onChange={e => setAuthor(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <ToolInput label="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
        <ToolInput label="Keywords" value={keywords} onChange={e => setKeywords(e.target.value)} />
      </div>
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><Tags size={18} /> Update Metadata</>}
      </button>
    </div>
  );
}

function SimpleTool({ icon: Icon, label, endpoint, outputName, desc }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file) { setError('Select a PDF'); return; }
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const blob = await postForm(endpoint, fd);
      downloadBlob(blob, outputName);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone label={`Upload PDF for ${label}`} onFile={setFile} file={file} />
      {desc && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: 0 }}>{desc}</p>}
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
      <button className="btn btn-primary" style={{ height: '3.2rem', borderRadius: '14px' }} onClick={run} disabled={busy || !file}>
        {busy ? <RefreshCw className="spin" size={18} /> : <><Icon size={18} /> {label}</>}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PdfTools() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTool, setActiveTool] = useState(null);
  const [search, setSearch] = useState('');

  const filteredTools = tools.filter(t => {
    const matchesCat = activeCategory === 'all' || t.cat === activeCategory;
    const matchesSearch = t.label.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderTool = () => {
    if (!activeTool) return null;
    switch (activeTool.id) {
      case 'merge': return <MergeTool />;
      case 'split': return <RangeBasedTool icon={Scissors} label="Split PDF" endpoint="/pdf/split" outputName="split.pdf" />;
      case 'rotate': return <RotateTool />;
      case 'delete': return <RangeBasedTool icon={Trash2} label="Delete Pages" endpoint="/pdf/delete-pages" outputName="pages-deleted.pdf" />;
      case 'extract': return <RangeBasedTool icon={FileOutput} label="Extract Pages" endpoint="/pdf/extract-pages" outputName="extracted.pdf" />;
      case 'insert': return <InsertTool />;
      case 'reverse': return <SimpleTool icon={FlipVertical} label="Reverse Order" endpoint="/pdf/reverse" outputName="reversed.pdf" desc="Flips the entire page sequence of your PDF." />;
      case 'compress': return <SimpleTool icon={Minimize2} label="Compress PDF" endpoint="/pdf/compress" outputName="compressed.pdf" desc="Optimizes document structures to reduce file size." />;
      case 'protect': return <PasswordTool type="protect" />;
      case 'unlock': return <PasswordTool type="unlock" />;
      case 'sign': return <SignTool />;
      case 'watermark': return <WatermarkTool />;
      case 'metadata': return <MetadataTool />;
      case 'flatten': return <SimpleTool icon={Layers} label="Flatten PDF" endpoint="/pdf/flatten" outputName="flattened.pdf" desc="Converts form fields to static text elements." />;
      case 'numbers': return <SimpleTool icon={ListOrdered} label="Add Page Numbers" endpoint="/pdf/page-numbers" outputName="numbered.pdf" desc="Adds page numbers to the bottom center of all pages." />;
      default: return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Info size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Specific panel for <strong>{activeTool.label}</strong> is under maintenance.</p>
        </div>
      );
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', gap: '2.5rem', position: 'relative' }}>
      
      {/* ── Sidebar Navigation ── */}
      <aside style={{ width: '260px', flexShrink: 0 }}>
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              PDF <span style={{ color: '#818cf8' }}>Tools</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>The world's most powerful PDF engine, right in your browser.</p>
          </div>

          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
            <input 
              type="text" placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '0.8rem 1rem 0.8rem 2.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setActiveTool(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  padding: '0.85rem 1rem', borderRadius: '14px',
                  background: activeCategory === cat.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: activeCategory === cat.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeCategory === cat.id ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  textAlign: 'left'
                }}
              >
                <cat.icon size={16} />
                <span style={{ flex: 1 }}>{cat.label}</span>
                {activeCategory === cat.id && <ChevronRight size={12} />}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <AnimatePresence mode="wait">
          {!activeTool ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}
            >
              {filteredTools.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => setActiveTool(tool)}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '24px',
                    padding: '1.75rem',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '200px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color + '44'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '100px', height: '100px', background: tool.color, filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }} />
                  
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: '14px', background: `${tool.color}15`, border: `1px solid ${tool.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      <tool.icon size={22} color={tool.color} />
                    </div>
                    <h3 style={{ margin: '0 0 0.4rem 0', color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>{tool.label}</h3>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6 }}>{tool.desc}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.25rem', color: tool.color, fontSize: '0.8rem', fontWeight: 800 }}>
                    Get Started <ChevronRight size={12} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              style={{ maxWidth: '700px', margin: '0 auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <button 
                  onClick={() => setActiveTool(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  <Layout size={14} /> Back
                </button>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>{activeTool.label}</h2>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${activeTool.color}15`, border: `1px solid ${activeTool.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <activeTool.icon size={16} color={activeTool.color} />
                    </div>
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{activeTool.desc}</p>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', padding: '2.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${activeTool.color}, transparent)` }} />
                {renderTool()}
              </div>

              <div style={{ marginTop: '1.5rem', background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.08)', borderRadius: '20px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                  <Info size={18} />
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Files are processed securely in our buffers and never persisted beyond 30 minutes. Use the <strong>Metadata</strong> tool if you wish to remove sensitive document properties before sharing.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
