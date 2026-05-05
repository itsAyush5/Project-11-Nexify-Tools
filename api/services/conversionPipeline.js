const path = require('path');
const fs = require('fs');
const cloudConvert = require('../engines/cloudConvert');
const localConvert = require('../engines/localConvert');

// Image extensions Jimp can handle natively (no API needed)
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp'];

async function execute(jobId, fileId, targetFormat, jobs) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.progress = 5;

  // Reconstruct the original uploaded file path and output path
  const inputPath = path.join(__dirname, '..', 'uploads', fileId);
  const outExt = targetFormat.toLowerCase().replace('.', '');
  const outputPath = path.join(__dirname, '..', 'uploads', `${jobId}.${outExt}`);

  // Derive the actual input extension from the fileId (uuid-originalname.ext)
  const inputExt = path.extname(fileId).toLowerCase().replace('.', '');

  console.log(`[NexConvert] Job ${jobId}: ${inputExt} → ${outExt}`);

  try {
    // ── Validate input file exists ──────────────────────────────────────────
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Uploaded file not found: ${fileId}`);
    }

    // ─── ENGINE 1: Local engine — handles code/data/text conversions offline ──
    if (localConvert.canHandle(`.${inputExt}`, `.${outExt}`)) {
      console.log(`[NexConvert] Routing to Local engine (code/data/text)...`);
      job.progress = 20;
      await localConvert.convert(inputPath, outputPath, `.${inputExt}`, `.${outExt}`);
      job.progress = 100;
      job.status = 'completed';
      job.outputPath = outputPath;
      console.log(`[NexConvert] Job ${jobId} COMPLETED via Local engine.`);
      return;
    }

    // ─── ENGINE 2: Jimp for image-to-image (offline, no API key needed) ──────
    if (IMAGE_EXTS.includes(inputExt) && IMAGE_EXTS.includes(outExt)) {
      if (outExt === 'svg') {
        console.log(`[NexConvert] Using Potrace engine for image-to-SVG (offline).`);
        const imageTools = require('../engines/imageTools');
        job.progress = 30;
        await imageTools.traceToSvg(inputPath, outputPath);
        job.progress = 100;
        job.status = 'completed';
        job.outputPath = outputPath;
        console.log(`[NexConvert] Job ${jobId} COMPLETED via Potrace.`);
        return;
      }

      console.log(`[NexConvert] Using Jimp image engine (offline).`);
      const Jimp = require('jimp');
      job.progress = 30;
      const image = await Jimp.read(inputPath);
      job.progress = 70;
      await image.writeAsync(outputPath);
      job.progress = 100;
      job.status = 'completed';
      job.outputPath = outputPath;
      console.log(`[NexConvert] Job ${jobId} COMPLETED via Jimp.`);
      return;
    }

    // ─── ENGINE 3: PDF Tools for image-to-PDF or PDF-to-Image (offline) ──────
    if (inputExt === 'pdf' && IMAGE_EXTS.includes(outExt)) {
      console.log(`[NexConvert] Using imageTools for PDF-to-Image (offline).`);
      const imageTools = require('../engines/imageTools');
      job.progress = 40;
      await imageTools.pdfToImage(inputPath, outputPath, outExt);
      job.progress = 100;
      job.status = 'completed';
      job.outputPath = outputPath;
      console.log(`[NexConvert] Job ${jobId} COMPLETED via imageTools.`);
      return;
    }

    if (IMAGE_EXTS.includes(inputExt) && outExt === 'pdf') {
      console.log(`[NexConvert] Using PDF engine for image-to-PDF (offline).`);
      const pdfTools = require('./pdfTools');
      job.progress = 40;
      await pdfTools.imagesToPdf([inputPath], outputPath);
      job.progress = 100;
      job.status = 'completed';
      job.outputPath = outputPath;
      console.log(`[NexConvert] Job ${jobId} COMPLETED via PDF engine.`);
      return;
    }

    // ─── ENGINE 4: CloudConvert for everything else ───────────────────────────
    if (cloudConvert.isConfigured) {
      console.log(`[NexConvert] Routing to CloudConvert engine...`);
      job.progress = 15;

      await cloudConvert.convert(inputPath, outputPath, outExt, (p) => {
        job.progress = Math.max(job.progress, p);
      });

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        throw new Error('CloudConvert returned an empty or missing file.');
      }

      job.progress = 100;
      job.status = 'completed';
      job.outputPath = outputPath;
      console.log(`[NexConvert] Job ${jobId} COMPLETED via CloudConvert.`);
      return;
    }

    // ─── NO ENGINE AVAILABLE ─────────────────────────────────────────────────
    throw new Error(
      `Cannot convert ${inputExt} → ${outExt}: No local engine supports this pair, and CloudConvert is not configured.`
    );

  } catch (error) {
    console.error(`[NexConvert] Job ${jobId} FAILED:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    job.progress = 0;
  }
}

module.exports = { execute };

