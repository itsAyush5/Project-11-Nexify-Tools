import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book, Code, Terminal, Server, Shield, Zap,
  ChevronRight, Copy, Check, Info, AlertTriangle,
  FileSearch, RefreshCw, Download, Layers,
  Cpu, Globe, Lock, Clock
} from 'lucide-react';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeLang, setActiveLang] = useState('bash'); // 'bash' | 'node' | 'python'
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: Book },
    { id: 'authentication',  label: 'Authentication',  icon: Shield },
    { id: 'analyze',         label: '1. Analyze File', icon: FileSearch },
    { id: 'convert',         label: '2. Convert File', icon: RefreshCw },
    { id: 'status',          label: '3. Check Status', icon: Clock },
    { id: 'download',        label: '4. Download',     icon: Download },
    { id: 'rate-limits',     label: 'Rate Limits',     icon: Zap },
    { id: 'errors',          label: 'Error Codes',     icon: AlertTriangle },
  ];

  return (
    <div className="docs-container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '4rem', padding: '2rem 0' }}>

      {/* ── Sidebar ── */}
      <aside style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
        <div style={{ padding: '0 1rem 2rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6366f1', marginBottom: '1.5rem', opacity: 0.8 }}>Documentation</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.8rem',
                  padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid transparent',
                  background: activeSection === section.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: activeSection === section.id ? 'white' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: activeSection === section.id ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                }}
                onMouseEnter={e => { if (activeSection !== section.id) e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { if (activeSection !== section.id) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                <section.icon size={16} color={activeSection === section.id ? '#818cf8' : 'currentColor'} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ margin: '0 1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#4ade80', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            API Status: Operational
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
            Last updated: 5 mins ago. <br />
            v1.4.2 stable.
          </p>
        </div>
      </aside>

      {/* ── Content ── */}
      <main style={{ paddingRight: '2rem' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeSection === 'getting-started' && (
              <DocSection title="Getting Started">
                <p>Nexify Tools API is a RESTful interface for enterprise-grade file conversion. Our engine supports over 100+ file formats with high-fidelity output and advanced processing capabilities.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', margin: '3rem 0' }}>
                  <InfoCard icon={Server} title="Base URL" value="nexify-tools.web.app/api/v1" color="#6366f1" />
                  <InfoCard icon={Lock} title="Security" value="AES-256 at Rest" color="#f59e0b" />
                  <InfoCard icon={Zap} title="Uptime SLA" value="99.99%" color="#22c55e" />
                  <InfoCard icon={Cpu} title="Engine" value="Nexify Core v2" color="#ec4899" />
                </div>

                <h3>Key Concepts</h3>
                <p>Working with the Nexify API follows an <strong>Asynchronous Job Pattern</strong>. Because file conversion can be time-consuming, requests return immediately with a job handle, which you poll for completion.</p>

                <div style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '16px', padding: '2rem', marginTop: '2rem' }}>
                  <h4 style={{ margin: '0 0 1.5rem 0', color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Terminal size={18} /> Integration Lifecycle</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Step num="1" label="Upload & Analyze" desc="Post your binary file. We validate the file, determine its type, and return available output formats." />
                    <Step num="2" label="Initiate Conversion" desc="Specify your target format. We queue the task and return a unique Job ID." />
                    <Step num="3" label="Status Polling" desc="Request the status of your Job ID every 1-2 seconds until it reaches 'completed'." />
                    <Step num="4" label="Download" desc="Fetch the final converted file via our secure download endpoint." />
                  </div>
                </div>
              </DocSection>
            )}

            {activeSection === 'authentication' && (
              <DocSection title="Authentication">
                <p>Nexify Tools API uses cryptographically secure API Keys for authentication. For your protection, **keys are hashed (bcrypt) at rest** and are only displayed once upon generation. If you lose a key, you must revoke it and generate a new one.</p>

                <div className="card" style={{ padding: '2rem', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'white' }}>Using your API Key</h4>
                  <p>Pass your key in the <code>x-api-key</code> header for every request. Authentication is mandatory for all endpoints.</p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <LangBtn active={activeLang === 'bash'} label="cURL" onClick={() => setActiveLang('bash')} />
                    <LangBtn active={activeLang === 'node'} label="Node.js" onClick={() => setActiveLang('node')} />
                    <LangBtn active={activeLang === 'python'} label="Python" onClick={() => setActiveLang('python')} />
                  </div>

                  <CodeBlock
                    code={
                      activeLang === 'bash' ? `curl -H "x-api-key: YOUR_API_KEY" \\
     https://nexify-tools.web.app/api/v1/user/stats` :
                      activeLang === 'node' ? `const axios = require('axios');

const res = await axios.get('https://nexify-tools.web.app/api/v1/user/stats', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
});` :
                      `import requests

url = "https://nexify-tools.web.app/api/v1/user/stats"
headers = {"x-api-key": "YOUR_API_KEY"}

response = requests.get(url, headers=headers)`
                    }
                  />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={24} color="#f87171" />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 0.4rem 0', color: '#f87171', fontSize: '1rem', fontWeight: 700 }}>Protect your credentials</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(248,113,113,0.6)', lineHeight: 1.5 }}>
                      Your API keys carry full access to your Nexify account. Never commit keys to version control (Git) or expose them in client-side code. Use environment variables in your server-side environment.
                    </p>
                  </div>
                </div>
              </DocSection>
            )}

            {activeSection === 'analyze' && (
              <DocSection title="1. Analyze File">
                <p>The first step in any conversion is analysis. Uploading your file to this endpoint allows Nexify to determine the file type, validate integrity, and provide a list of conversion possibilities.</p>

                <Endpoint method="POST" path="/analyze" />

                <h3>Payload Specification</h3>
                <table className="docs-table">
                  <thead>
                    <tr><th>Parameter</th><th>Type</th><th>Location</th><th>Required</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="bold">file</td><td>Binary</td><td>FormData</td><td>Yes</td><td>The local file to upload. Max size: 100MB.</td></tr>
                    <tr><td className="bold">options</td><td>String</td><td>FormData</td><td>No</td><td>JSON string of analysis options.</td></tr>
                  </tbody>
                </table>

                <CodeBlock
                  title="Example Analysis Response"
                  code={`{
  "success": true,
  "data": {
    "fileId": "fl_5a9b3c",
    "filename": "report_2024.pdf",
    "mimetype": "application/pdf",
    "size": 420192,
    "metadata": { "pages": 12, "encrypted": false },
    "outputs": [
      { "format": "docx", "label": "Word Document" },
      { "format": "txt", "label": "Plain Text" },
      { "format": "jpg", "label": "Image Sequence" }
    ]
  }
}`}
                />
              </DocSection>
            )}

            {activeSection === 'convert' && (
              <DocSection title="2. Convert File">
                <p>Once you have a <code>fileId</code> from the analysis step, you can trigger a conversion task.</p>

                <Endpoint method="POST" path="/convert" />

                <h3>JSON Body Parameters</h3>
                <table className="docs-table">
                  <thead>
                    <tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="bold">fileId</td><td>String</td><td>-</td><td>ID returned from <code>/analyze</code></td></tr>
                    <tr><td className="bold">target</td><td>String</td><td>-</td><td>Desired output format (e.g. "png")</td></tr>
                    <tr><td className="bold">priority</td><td>Number</td><td>1</td><td>Job priority (1-5, 5 is highest)</td></tr>
                    <tr><td className="bold">webhook</td><td>String</td><td>null</td><td>Optional URL for job completion callback</td></tr>
                  </tbody>
                </table>

                <CodeBlock
                  title="Example Request Body"
                  code={`{
  "fileId": "fl_5a9b3c",
  "target": "docx",
  "priority": 3,
  "webhook": "https://myapp.com/api/webhooks/nexify-tools"
}`}
                />
              </DocSection>
            )}

            {activeSection === 'status' && (
              <DocSection title="3. Check Status">
                <p>Because conversion is asynchronous, you must check the status of your <code>jobId</code>. We recommend a polling interval of 2 seconds for optimal performance.</p>

                <Endpoint method="GET" path="/status/:jobId" />

                <h3>Response Statuses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <StatusRow label="queued" color="#94a3b8" desc="Job is waiting for an available worker node." />
                  <StatusRow label="processing" color="#6366f1" desc="Engine is actively converting the file." />
                  <StatusRow label="completed" color="#22c55e" desc="Job finished successfully. Ready for download." />
                  <StatusRow label="failed" color="#ef4444" desc="Error occurred. Check 'error' field in response." />
                </div>

                <CodeBlock
                  title="Completed Response"
                  code={`{
  "jobId": "job_9x2k1L",
  "status": "completed",
  "progress": 100,
  "result": {
    "filename": "report_2024.docx",
    "size": 385102,
    "downloadUrl": "/v1/download/job_9x2k1L"
  }
}`}
                />
              </DocSection>
            )}

            {activeSection === 'rate-limits' && (
              <DocSection title="Rate Limits">
                <p>To ensure system stability, Nexify Tools enforces rate limits based on your plan level. Professional and Enterprise tiers have significantly higher thresholds.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '2rem 0' }}>
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>API Request Limit</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a5b4fc' }}>60 <span style={{ fontSize: '0.9rem', opacity: 0.4 }}>REQ/MIN</span></div>
                  </div>
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>Concurrent Jobs</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a5b4fc' }}>5 <span style={{ fontSize: '0.9rem', opacity: 0.4 }}>SLOTS</span></div>
                  </div>
                </div>

                <h3>Exceeding Limits</h3>
                <p>When you exceed your limit, the API will respond with a <code>429 Too Many Requests</code> status code. The response header <code>Retry-After</code> will indicate how many seconds to wait before retrying.</p>
              </DocSection>
            )}

            {activeSection === 'errors' && (
              <DocSection title="Error Codes">
                <p>Nexify uses standard HTTP status codes to communicate success or failure.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                  <ErrorItem code="400" label="Bad Request" desc="The request was invalid or missing required parameters." />
                  <ErrorItem code="401" label="Unauthorized" desc="Invalid, expired, or missing API key." />
                  <ErrorItem code="403" label="Forbidden" desc="You do not have permission for this resource or format." />
                  <ErrorItem code="404" label="Not Found" desc="The specified File ID or Job ID does not exist." />
                  <ErrorItem code="413" label="Payload Too Large" desc="File exceeds the maximum upload limit (100MB)." />
                  <ErrorItem code="429" label="Too Many Requests" desc="You have exceeded your account's rate limit." />
                  <ErrorItem code="500" label="Server Error" desc="An internal error occurred in our processing engine." />
                </div>
              </DocSection>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .docs-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; border: 1px solid rgba(255,255,255,0.05); }
        .docs-table th { background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; text-align: left; }
        .docs-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        .docs-table td.bold { font-weight: 700; color: #a5b4fc; }
      `}</style>
    </div>
  );
}

function DocSection({ title, children }) {
  return (
    <div style={{ paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>{title}</h1>
      <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        <Icon size={14} color={color} /> {title}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{value}</div>
    </div>
  );
}

function Step({ num, label, desc }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
        {num}
      </div>
      <div>
        <h5 style={{ margin: '0 0 0.25rem 0', color: 'white', fontSize: '1rem' }}>{label}</h5>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function LangBtn({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
        background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
        color: active ? 'white' : 'rgba(255,255,255,0.4)',
        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
}

function CodeBlock({ code, title }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ margin: '1.5rem 0', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      {title && <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{title}</div>}
      <div style={{ background: '#0a0a0f', padding: '1.5rem', position: 'relative' }}>
        <button onClick={copy} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.4rem', borderRadius: '6px', color: copied ? '#4ade80' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <pre style={{ margin: 0, fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}><code>{code}</code></pre>
      </div>
    </div>
  );
}

function Endpoint({ method, path }) {
  const color = method === 'POST' ? '#818cf8' : '#34d399';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: '12px', margin: '2rem 0', fontFamily: "'JetBrains Mono', monospace" }}>
      <span style={{ background: color, color: 'white', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>{method}</span>
      <code style={{ fontSize: '1rem', color: 'white' }}>https://nexify-tools.web.app/api/v1{path}</code>
    </div>
  );
}

function StatusRow({ label, color, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 100, padding: '0.3rem 0.6rem', borderRadius: '6px', background: `${color}15`, color, fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', border: `1px solid ${color}30` }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>{desc}</div>
    </div>
  );
}

function ErrorItem({ code, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 40, fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>{code}</div>
      <div style={{ width: 150, fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{label}</div>
      <div style={{ flex: 1, fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}
