require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');
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
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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
  const category = capabilityEngine.EXT_TO_CATEGORY[inputExt] || 'unknown';

  res.json({
    fileId: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    extension: inputExt,
    category,
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
    
    if (outputs.length === 1) {
      sendFile(res, outputs[0], `split-part1.pdf`);
    } else {
      const zip = new AdmZip();
      outputs.forEach((outPath, i) => {
        zip.addLocalFile(outPath, '', `split-part${i + 1}.pdf`);
      });
      const zipPath = path.join(uploadDir(), `split-${jobId}.zip`);
      zip.writeZip(zipPath);
      sendFile(res, zipPath, 'split-files.zip');
    }
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
    
    const scriptPath = path.join(__dirname, 'scripts', 'pdf_crypto.py');
    const out = execSync(`python "${scriptPath}" encrypt "${req.file.path}" "${outputPath}" "${password}"`).toString();
    if (!out.includes('SUCCESS')) throw new Error(out);

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
    
    const scriptPath = path.join(__dirname, 'scripts', 'pdf_crypto.py');
    const out = execSync(`python "${scriptPath}" decrypt "${req.file.path}" "${outputPath}" "${password}"`).toString();
    if (!out.includes('SUCCESS')) throw new Error(out);

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

// IMAGES TO PDF
app.post('/api/pdf/images-to-pdf', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Need at least 1 image' });
    const inputPaths = req.files.map(f => f.path);
    const outputPath = path.join(uploadDir(), `images-${uuidv4()}.pdf`);
    await pdfTools.imagesToPdf(inputPaths, outputPath);
    logActivity(req.user?.id, 'Images to PDF', req.files[0].originalname);
    sendFile(res, outputPath, 'images-converted.pdf');
  } catch (err) {
    console.error('[PDF ImagesToPdf]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// WATERMARK
app.post('/api/pdf/watermark', upload.single('file'), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Watermark text is required' });
    const outputPath = path.join(uploadDir(), `watermark-${uuidv4()}.pdf`);
    await pdfTools.addWatermark(req.file.path, outputPath, text);
    logActivity(req.user?.id, 'Watermark PDF', req.file.originalname);
    sendFile(res, outputPath, 'watermarked.pdf');
  } catch (err) {
    console.error('[PDF Watermark]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PAGE NUMBERS
app.post('/api/pdf/page-numbers', upload.single('file'), async (req, res) => {
  try {
    const outputPath = path.join(uploadDir(), `numbered-${uuidv4()}.pdf`);
    await pdfTools.addPageNumbers(req.file.path, outputPath);
    logActivity(req.user?.id, 'Page Numbers PDF', req.file.originalname);
    sendFile(res, outputPath, 'numbered.pdf');
  } catch (err) {
    console.error('[PDF PageNumbers]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// METADATA
app.post('/api/pdf/metadata', upload.single('file'), async (req, res) => {
  try {
    const { title, author, subject, keywords } = req.body;
    const outputPath = path.join(uploadDir(), `metadata-${uuidv4()}.pdf`);
    await pdfTools.editMetadata(req.file.path, outputPath, { title, author, subject, keywords });
    logActivity(req.user?.id, 'Metadata PDF', req.file.originalname);
    sendFile(res, outputPath, 'metadata-updated.pdf');
  } catch (err) {
    console.error('[PDF Metadata]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// FLATTEN FORM
app.post('/api/pdf/flatten', upload.single('file'), async (req, res) => {
  try {
    const outputPath = path.join(uploadDir(), `flattened-${uuidv4()}.pdf`);
    await pdfTools.flattenForm(req.file.path, outputPath);
    logActivity(req.user?.id, 'Flatten PDF Form', req.file.originalname);
    sendFile(res, outputPath, 'flattened.pdf');
  } catch (err) {
    console.error('[PDF Flatten]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// COMPRESS PDF
app.post('/api/pdf/compress', upload.single('file'), async (req, res) => {
  try {
    const outputPath = path.join(uploadDir(), `compressed-${uuidv4()}.pdf`);
    await pdfTools.compress(req.file.path, outputPath);
    logActivity(req.user?.id, 'Compress PDF', req.file.originalname);
    sendFile(res, outputPath, 'compressed.pdf');
  } catch (err) {
    console.error('[PDF Compress]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// REVERSE PAGES
app.post('/api/pdf/reverse', upload.single('file'), async (req, res) => {
  try {
    const outputPath = path.join(uploadDir(), `reversed-${uuidv4()}.pdf`);
    await pdfTools.reversePages(req.file.path, outputPath);
    logActivity(req.user?.id, 'Reverse PDF Pages', req.file.originalname);
    sendFile(res, outputPath, 'reversed.pdf');
  } catch (err) {
    console.error('[PDF Reverse]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DUPLICATE PAGES
app.post('/api/pdf/duplicate', upload.single('file'), async (req, res) => {
  try {
    const { pages, times = 1 } = req.body;
    if (!pages) return res.status(400).json({ error: 'Page range is required' });
    const outputPath = path.join(uploadDir(), `duplicated-${uuidv4()}.pdf`);
    await pdfTools.duplicatePages(req.file.path, outputPath, pages, parseInt(times));
    logActivity(req.user?.id, 'Duplicate PDF Pages', req.file.originalname);
    sendFile(res, outputPath, 'duplicated.pdf');
  } catch (err) {
    console.error('[PDF Duplicate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD BLANK PAGE
app.post('/api/pdf/blank-page', upload.single('file'), async (req, res) => {
  try {
    const { position = 1, pageSize = 'A4' } = req.body;
    const outputPath = path.join(uploadDir(), `blank-${uuidv4()}.pdf`);
    await pdfTools.addBlankPage(req.file.path, outputPath, position, pageSize);
    logActivity(req.user?.id, 'Add Blank Page', req.file.originalname);
    sendFile(res, outputPath, 'with-blank-page.pdf');
  } catch (err) {
    console.error('[PDF BlankPage]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// CROP PAGES
app.post('/api/pdf/crop', upload.single('file'), async (req, res) => {
  try {
    const { marginTop = 0, marginRight = 0, marginBottom = 0, marginLeft = 0 } = req.body;
    const outputPath = path.join(uploadDir(), `cropped-${uuidv4()}.pdf`);
    await pdfTools.cropPages(req.file.path, outputPath, marginTop, marginRight, marginBottom, marginLeft);
    logActivity(req.user?.id, 'Crop PDF Pages', req.file.originalname);
    sendFile(res, outputPath, 'cropped.pdf');
  } catch (err) {
    console.error('[PDF Crop]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD HEADER / FOOTER
app.post('/api/pdf/header-footer', upload.single('file'), async (req, res) => {
  try {
    const { header = '', footer = '' } = req.body;
    if (!header && !footer) return res.status(400).json({ error: 'Enter a header or footer text' });
    const outputPath = path.join(uploadDir(), `headerfooter-${uuidv4()}.pdf`);
    await pdfTools.addHeaderFooter(req.file.path, outputPath, header, footer);
    logActivity(req.user?.id, 'Header/Footer PDF', req.file.originalname);
    sendFile(res, outputPath, 'header-footer.pdf');
  } catch (err) {
    console.error('[PDF HeaderFooter]', err.message);
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
  res.redirect('http://localhost:5173'); // Redirect back to frontend
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
  try {
    const key = keysService.generateKey(req.user.id, name || 'Default Key');
    res.json(key);
  } catch (err) {
    if (err.code === 'KEY_LIMIT_REACHED') {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to generate key' });
  }
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
