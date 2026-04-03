require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const capabilityEngine = require('./services/capabilityEngine');
const pipeline = require('./services/conversionPipeline');
const pdfTools = require('./services/pdfTools');

const session = require('express-session');
const passport = require('./services/auth');
const keysService = require('./services/keys');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jobs = new Map();

const app = express();
const port = process.env.PORT || 5000;

// Essential middleware for Auth/API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));

// Enable session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexify-super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());

// Global API Key / Auth middleware
app.use('/api', keysService.apiKeyMiddleware);

const requireAuth = (req, res, next) => {
  if (req.user) return next();
  res.status(401).json({ error: 'Auth required. Use x-api-key or login.' });
};

// Activity Logging Helper
const logActivity = (userId, type, filename, status = 'completed') => {
  if (!userId) return;
  try {
    db.prepare('INSERT INTO activity_logs (id, user_id, action_type, filename, status) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), userId, type, filename, status
    );
  } catch (err) { console.error('[Log Error]', err.message); }
};

// Health check for status detection
app.get('/api/ping', (req, res) => res.json({ status: 'ok', user: req.user?.email || null }));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Routes
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const inputExt = path.extname(req.file.originalname).toLowerCase();
  const availableOutputs = capabilityEngine.getAvailableOutputs(inputExt);

  res.json({
    fileId: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    extension: inputExt,
    availableOutputs
  });
  logActivity(req.user?.id, 'Analyze File', req.file.originalname);
});

app.post('/api/convert', async (req, res) => {
  const { fileId, targetFormat } = req.body;
  
  if (!fileId || !targetFormat) {
    return res.status(400).json({ error: 'Missing fileId or targetFormat' });
  }

  const jobId = uuidv4();
  jobs.set(jobId, { status: 'pending', progress: 0, fileId, targetFormat });

  // Start conversion in background (stateless execution)
  pipeline.execute(jobId, fileId, targetFormat, jobs);

  res.json({ jobId });
});

app.get('/api/status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/download/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== 'completed') return res.status(404).send('Not ready');
  res.download(job.outputPath);
});

// ── PDF TOOLS ──────────────────────────────────────────────────────────────

const uploadDir = () => {
  const dir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return dir;
};

const sendFile = (res, filePath, downloadName) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.sendFile(path.resolve(filePath), (err) => {
    if (err) res.status(500).send('Error sending file');
  });
};

// MERGE PDFs
app.post('/api/pdf/merge', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) return res.status(400).json({ error: 'Need at least 2 PDF files' });
    const inputPaths = req.files.map(f => f.path);
    const outputPath = path.join(uploadDir(), `merge-${uuidv4()}.pdf`);
    await pdfTools.merge(inputPaths, outputPath);
    logActivity(req.user?.id, 'Merge PDF', `${req.files.length} files`);
    sendFile(res, outputPath, 'merged.pdf');
  } catch (err) {
    console.error('[PDF Merge]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SPLIT PDF
app.post('/api/pdf/split', upload.single('file'), async (req, res) => {
  try {
    const ranges = JSON.parse(req.body.ranges || '[]');
    if (!req.file || !ranges.length) return res.status(400).json({ error: 'Missing file or ranges' });
    const jobId = uuidv4();
    const outputs = await pdfTools.split(req.file.path, ranges, uploadDir(), jobId);
    logActivity(req.user?.id, 'Split PDF', req.file.originalname);
    sendFile(res, outputs[0], `split-part1.pdf`);
  } catch (err) {
    console.error('[PDF Split]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ROTATE PAGES
app.post('/api/pdf/rotate', upload.single('file'), async (req, res) => {
  try {
    const { pages = 'all', degrees: deg = 90 } = req.body;
    const outputPath = path.join(uploadDir(), `rotate-${uuidv4()}.pdf`);
    await pdfTools.rotate(req.file.path, outputPath, pages, parseInt(deg));
    logActivity(req.user?.id, 'Rotate PDF', req.file.originalname);
    sendFile(res, outputPath, 'rotated.pdf');
  } catch (err) {
    console.error('[PDF Rotate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE PAGES
app.post('/api/pdf/delete-pages', upload.single('file'), async (req, res) => {
  try {
    const { pages } = req.body;
    if (!pages) return res.status(400).json({ error: 'Missing pages parameter' });
    const outputPath = path.join(uploadDir(), `deleted-${uuidv4()}.pdf`);
    await pdfTools.deletePages(req.file.path, outputPath, pages);
    logActivity(req.user?.id, 'Delete Pages', req.file.originalname);
    sendFile(res, outputPath, 'pages-deleted.pdf');
  } catch (err) {
    console.error('[PDF Delete]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// EXTRACT PAGES
app.post('/api/pdf/extract-pages', upload.single('file'), async (req, res) => {
  try {
    const { pages } = req.body;
    if (!pages) return res.status(400).json({ error: 'Missing pages parameter' });
    const outputPath = path.join(uploadDir(), `extracted-${uuidv4()}.pdf`);
    await pdfTools.extractPages(req.file.path, outputPath, pages);
    logActivity(req.user?.id, 'Extract Pages', req.file.originalname);
    sendFile(res, outputPath, 'extracted.pdf');
  } catch (err) {
    console.error('[PDF Extract]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// INSERT PAGES
app.post('/api/pdf/insert', upload.fields([{ name: 'base' }, { name: 'insert' }]), async (req, res) => {
  try {
    const position = parseInt(req.body.position || '1');
    const outputPath = path.join(uploadDir(), `inserted-${uuidv4()}.pdf`);
    await pdfTools.insertPages(req.files.base[0].path, req.files.insert[0].path, outputPath, position);
    logActivity(req.user?.id, 'Insert Pages', req.files.base[0].originalname);
    sendFile(res, outputPath, 'with-inserted-pages.pdf');
  } catch (err) {
    console.error('[PDF Insert]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PROTECT PDF (Add Password)
app.post('/api/pdf/protect', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    const outputPath = path.join(uploadDir(), `protected-${uuidv4()}.pdf`);
    
    const cloudConvert = require('./engines/cloudConvert');
    await cloudConvert.protect(req.file.path, outputPath, password);
    logActivity(req.user?.id, 'Protect PDF', req.file.originalname);
    
    sendFile(res, outputPath, 'protected.pdf');
  } catch (err) {
    console.error('[PDF Protect]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// UNLOCK PDF (Remove Password)
app.post('/api/pdf/unlock', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to unlock' });
    const outputPath = path.join(uploadDir(), `unlocked-${uuidv4()}.pdf`);
    
    const cloudConvert = require('./engines/cloudConvert');
    await cloudConvert.unlock(req.file.path, outputPath, password);
    logActivity(req.user?.id, 'Unlock PDF', req.file.originalname);
    
    sendFile(res, outputPath, 'unlocked.pdf');
  } catch (err) {
    console.error('[PDF Unlock]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SIGN PDF
app.post('/api/pdf/sign', upload.fields([{ name: 'file' }, { name: 'signature' }]), async (req, res) => {
  try {
    const { page = 1, x = 100, y = 100, width = 200, height = 100 } = req.body;
    const outputPath = path.join(uploadDir(), `signed-${uuidv4()}.pdf`);
    
    await pdfTools.sign(
      req.files.file[0].path, 
      outputPath, 
      req.files.signature[0].path,
      parseInt(page) - 1, 
      parseFloat(x), 
      parseFloat(y), 
      parseFloat(width), 
      parseFloat(height)
    );
    logActivity(req.user?.id, 'Sign PDF', req.files.file[0].originalname);
    sendFile(res, outputPath, 'signed.pdf');
  } catch (err) {
    console.error('[PDF Sign]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AUTH ROUTES ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  try {
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)').run(id, email, hash, name);
    res.json({ status: 'registered' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ email: user.email, name: user.full_name });
    });
  })(req, res, next);
});

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('http://localhost:5174'); // Redirect back to frontend
});

app.get('/api/auth/logout', (req, res) => {
  req.logout(() => res.json({ status: 'logged out' }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ email: req.user.email, name: req.user.full_name, pic: req.user.profile_pic });
});

// ── DASHBOARD ROUTES ────────────────────────────────────────────────────────

app.get('/api/user/dashboard', requireAuth, (req, res) => {
  const userId = req.user.id;
  const stats = db.prepare('SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?').get(userId);
  const keysCount = db.prepare('SELECT COUNT(*) as total FROM api_keys WHERE user_id = ?').get(userId);
  const history = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);
  
  // Calculate "streak" (simple days active)
  const streak = db.prepare('SELECT COUNT(DISTINCT date(created_at)) as total FROM activity_logs WHERE user_id = ?').get(userId);

  res.json({
    totalConversions: stats.total,
    activeKeys: keysCount.total,
    activityStreak: streak.total,
    history
  });
});

// ── API KEY ROUTES ──────────────────────────────────────────────────────────

app.post('/api/keys/generate', requireAuth, (req, res) => {
  const { name } = req.body;
  const key = keysService.generateKey(req.user.id, name || 'Default Key');
  res.json(key);
});

app.get('/api/keys/list', requireAuth, (req, res) => {
  const keys = keysService.listKeys(req.user.id);
  res.json(keys);
});

app.post('/api/keys/revoke', requireAuth, (req, res) => {
  const { id } = req.body;
  keysService.revokeKey(id, req.user.id);
  res.json({ status: 'revoked' });
});

app.listen(port, () => {
  console.log(`NexConvert API starting on port ${port}...`);
  try {
    capabilityEngine.initialize();
    console.log('Capability Engine Ready');
  } catch (e) {
    console.error('Capability Engine Failed', e);
  }
  console.log(`NexConvert API fully running on port ${port}`);
});
