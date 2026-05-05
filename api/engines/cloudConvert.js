/**
 * CloudConvert Engine — Uses REST API directly via axios to avoid
 * Node.js v18+ native-fetch / SSE compatibility issues with the SDK.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const apiKey = process.env.CLOUDCONVERT_API_KEY || '';
const BASE_URL = 'https://api.cloudconvert.com/v2';

// Axios instance with auth header pre-set
const cc = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${apiKey}` },
  timeout: 60000,
});

// ── Helper: poll a job until it finishes (completed / error) ─────────────────
async function pollJob(jobId, onProgress, startPct = 30, endPct = 90) {
  const MAX_WAIT_MS = 10 * 60 * 1000; // 10 minutes max
  const POLL_INTERVAL = 3000;         // poll every 3 s
  const start = Date.now();
  let pct = startPct;

  while (true) {
    if (Date.now() - start > MAX_WAIT_MS) {
      throw new Error('CloudConvert job timed out after 10 minutes');
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    const { data } = await cc.get(`/jobs/${jobId}`);
    const job = data.data;

    // Smoothly increment progress indicator
    pct = Math.min(endPct, pct + 5);
    onProgress && onProgress(pct);

    if (job.status === 'finished') return job;
    if (job.status === 'error') {
      const errTask = job.tasks.find(t => t.status === 'error');
      throw new Error(`CloudConvert job failed: ${errTask?.message || errTask?.code || 'Unknown error'}`);
    }
    // Otherwise status is 'processing' or 'waiting' — keep polling
  }
}

// ── Helper: download a URL to disk via axios stream ─────────────────────────
async function downloadUrl(url, destPath) {
  const response = await axios({ method: 'GET', url, responseType: 'stream', timeout: 120000 });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// ── Helper: derive input format from filename ────────────────────────────────
function inputFmt(filePath) {
  return path.extname(filePath).toLowerCase().replace('.', '') || undefined;
}

// ── MAIN CONVERT ──────────────────────────────────────────────────────────────
async function convert(inputPath, outputPath, targetFormat, onProgress) {
  if (!apiKey) {
    throw new Error('CloudConvert API Key not configured. Set CLOUDCONVERT_API_KEY in api/.env');
  }

  const inputFormat = inputFmt(inputPath);
  const outputFormat = targetFormat.toLowerCase().replace('.', '');

  console.log(`[CloudConvert] ${path.basename(inputPath)} (${inputFormat}) → ${outputFormat}`);

  // Step 1: Create job
  const { data: jobData } = await cc.post('/jobs', {
    tasks: {
      'upload-file': {
        operation: 'import/upload',
      },
      'convert-file': {
        operation: 'convert',
        input: ['upload-file'],
        input_format: inputFormat,
        output_format: outputFormat,
      },
      'export-file': {
        operation: 'export/url',
        input: ['convert-file'],
        inline: false,
        archive_multiple_files: false,
      },
    },
  });

  const job = jobData.data;
  const uploadTask = job.tasks.find(t => t.name === 'upload-file');
  if (!uploadTask) throw new Error('CloudConvert did not return an upload task');

  // Step 2: Upload file using multipart/form-data to the task's upload URL
  console.log(`[CloudConvert] Uploading to job ${job.id}...`);
  const form = new FormData();
  // Attach all required form fields from the task
  if (uploadTask.result && uploadTask.result.form && uploadTask.result.form.parameters) {
    for (const [key, val] of Object.entries(uploadTask.result.form.parameters)) {
      form.append(key, val);
    }
  }
  form.append('file', fs.createReadStream(inputPath), path.basename(inputPath));

  const uploadUrl = uploadTask.result?.form?.url || `${BASE_URL}/import/upload/${uploadTask.id}`;
  await axios.post(uploadUrl, form, {
    headers: { ...form.getHeaders() },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120000,
  });

  onProgress && onProgress(20);

  // Step 3: Poll until done
  const completedJob = await pollJob(job.id, onProgress, 25, 85);

  // Step 4: Find export task result
  const exportTask = completedJob.tasks.find(t => t.name === 'export-file');
  if (!exportTask || exportTask.status === 'error') {
    throw new Error('Export task failed or not found in completed job');
  }
  if (!exportTask.result?.files?.length) {
    throw new Error('No output file returned by CloudConvert');
  }

  // Step 5: Download result
  const outputFile = exportTask.result.files[0];
  console.log(`[CloudConvert] Downloading: ${outputFile.filename}`);
  await downloadUrl(outputFile.url, outputPath);

  onProgress && onProgress(100);
  console.log(`[CloudConvert] Done → ${outputPath}`);
}

// ── PROTECT PDF (Add Password) ────────────────────────────────────────────────
async function protect(inputPath, outputPath, password, onProgress) {
  if (!apiKey) throw new Error('CloudConvert API Key not configured.');

  const { data: jobData } = await cc.post('/jobs', {
    tasks: {
      'upload':  { operation: 'import/upload' },
      'protect': {
        operation: 'pdf/encrypt',
        input: ['upload'],
        user_password: password,
        owner_password: password,
      },
      'export':  { operation: 'export/url', input: ['protect'] },
    },
  });

  const job = jobData.data;
  const uploadTask = job.tasks.find(t => t.name === 'upload');

  const form = new FormData();
  if (uploadTask.result?.form?.parameters) {
    for (const [k, v] of Object.entries(uploadTask.result.form.parameters)) form.append(k, v);
  }
  form.append('file', fs.createReadStream(inputPath), path.basename(inputPath));
  const uploadUrl = uploadTask.result?.form?.url || `${BASE_URL}/import/upload/${uploadTask.id}`;
  await axios.post(uploadUrl, form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });

  onProgress && onProgress(30);
  const completedJob = await pollJob(job.id, onProgress, 35, 85);

  const exportTask = completedJob.tasks.find(t => t.name === 'export');
  if (!exportTask?.result?.files?.length) throw new Error('CloudConvert protect returned no output file');
  await downloadUrl(exportTask.result.files[0].url, outputPath);
  onProgress && onProgress(100);
}

// ── UNLOCK PDF (Remove Password) ─────────────────────────────────────────────
async function unlock(inputPath, outputPath, password, onProgress) {
  if (!apiKey) throw new Error('CloudConvert API Key not configured.');

  const { data: jobData } = await cc.post('/jobs', {
    tasks: {
      'upload':  { operation: 'import/upload' },
      'unlock':  {
        operation: 'pdf/decrypt',
        input: ['upload'],
        user_password: password,
      },
      'export':  { operation: 'export/url', input: ['unlock'] },
    },
  });

  const job = jobData.data;
  const uploadTask = job.tasks.find(t => t.name === 'upload');

  const form = new FormData();
  if (uploadTask.result?.form?.parameters) {
    for (const [k, v] of Object.entries(uploadTask.result.form.parameters)) form.append(k, v);
  }
  form.append('file', fs.createReadStream(inputPath), path.basename(inputPath));
  const uploadUrl = uploadTask.result?.form?.url || `${BASE_URL}/import/upload/${uploadTask.id}`;
  await axios.post(uploadUrl, form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });

  onProgress && onProgress(30);
  const completedJob = await pollJob(job.id, onProgress, 35, 85);

  const exportTask = completedJob.tasks.find(t => t.name === 'export');
  if (!exportTask?.result?.files?.length) throw new Error('CloudConvert unlock returned no output file');
  await downloadUrl(exportTask.result.files[0].url, outputPath);
  onProgress && onProgress(100);
}

// Supported format list (informational)
const supports = [
  // Documents
  '.pdf', '.docx', '.doc', '.odt', '.rtf', '.txt', '.md', '.html', '.htm',
  '.epub', '.mobi', '.azw', '.azw3', '.fb2', '.djvu', '.xps', '.pages',
  '.wpd', '.abw', '.tex', '.rst',
  // Spreadsheets
  '.xlsx', '.xls', '.ods', '.csv', '.tsv', '.numbers', '.xlsm', '.xlsb',
  // Presentations
  '.pptx', '.ppt', '.odp', '.key', '.pps', '.ppsx', '.potx',
  // Images
  '.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif',
  '.ico', '.avif', '.svg', '.heic', '.heif', '.psd', '.raw', '.arw',
  '.cr2', '.nef', '.dng', '.eps', '.ai', '.xcf', '.jxl', '.exr', '.hdr',
  // Video
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp', '.m4v',
  '.ts', '.mts', '.vob', '.ogv', '.f4v', '.asf', '.rm', '.mpg', '.mpeg',
  '.mxf', '.divx',
  // Audio
  '.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.opus',
  '.aiff', '.aif', '.ape', '.mka', '.mid', '.midi', '.amr', '.ac3',
  // Archives
  '.zip', '.rar', '.tar', '.gz', '.bz2', '.xz', '.7z', '.tgz',
  // Data
  '.json', '.xml', '.yaml', '.yml', '.toml', '.ndjson', '.jsonl', '.geojson',
  // Fonts
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  // Vector
  '.dxf', '.cdr', '.emf', '.wmf',
];

module.exports = {
  convert,
  protect,
  unlock,
  supports,
  isConfigured: !!apiKey,
};
