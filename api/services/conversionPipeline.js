const path = require('path');
const fs = require('fs');
const cloudConvert = require('../engines/cloudConvert');
const localConvert = require('../engines/localConvert');
const capabilityEngine = require('./capabilityEngine');

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

    // ─── LOCAL ENGINE ATTEMPTS ──────────────────────────────────────────────
    let localSuccess = false;
    try {
      // ENGINE 1: Code/Data/Text
      if (localConvert.canHandle(`.${inputExt}`, `.${outExt}`)) {
        console.log(`[NexConvert] Routing to Local engine (code/data/text)...`);
        job.progress = 20;
        await localConvert.convert(inputPath, outputPath, `.${inputExt}`, `.${outExt}`);
        localSuccess = true;
      }
      
      // ENGINE 2: Jimp for image-to-image/SVG
      else if (IMAGE_EXTS.includes(inputExt) && IMAGE_EXTS.includes(outExt)) {
        if (outExt === 'svg') {
          console.log(`[NexConvert] Using Potrace engine for image-to-SVG.`);
          const imageTools = require('../engines/imageTools');
          job.progress = 30;
          await imageTools.traceToSvg(inputPath, outputPath);
        } else {
          console.log(`[NexConvert] Using Jimp image engine.`);
          const Jimp = require('jimp');
          job.progress = 30;
          const image = await Jimp.read(inputPath);
          await image.writeAsync(outputPath);
        }
        localSuccess = true;
      }

      // ENGINE 3: PDF Tools (PDF <-> Image)
      else if ((inputExt === 'pdf' && IMAGE_EXTS.includes(outExt)) || (IMAGE_EXTS.includes(inputExt) && outExt === 'pdf')) {
        console.log(`[NexConvert] Using PDF Tools engine.`);
        const imageTools = require('../engines/imageTools');
        const pdfTools = require('./pdfTools');
        job.progress = 40;
        if (inputExt === 'pdf') {
          await imageTools.pdfToImage(inputPath, outputPath, outExt);
        } else {
          await pdfTools.imagesToPdf([inputPath], outputPath);
        }
        localSuccess = true;
      }

      // ENGINE 4: FFmpeg for Video/Audio
      else if (VIDEO_AUDIO_EXTS.includes(inputExt) && VIDEO_AUDIO_EXTS.includes(outExt)) {
        console.log(`[NexConvert] Using FFmpeg for media conversion.`);
        const ffmpeg = require('fluent-ffmpeg');
        job.progress = 20;
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .output(outputPath)
                .on('progress', (p) => { job.progress = Math.min(95, 20 + Math.floor(p.percent || 0)); })
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        localSuccess = true;
      }

      if (localSuccess) {
        job.progress = 100;
        job.status = 'completed';
        job.outputPath = outputPath;
        console.log(`[NexConvert] Job ${jobId} COMPLETED via Local engine.`);
        return;
      }

    } catch (localError) {
      console.warn(`[NexConvert] Local engine failed for ${jobId}: ${localError.message}. Falling back to CloudConvert...`);
    }

    // ─── ENGINE 5: CloudConvert Fallback ────────────────────────────────────
    if (cloudConvert.isConfigured) {
      console.log(`[NexConvert] Routing to CloudConvert engine...`);
      job.progress = 15;

      await cloudConvert.convert(inputPath, outputPath, outExt, (p) => {
        job.progress = Math.max(job.progress, p);
      });

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        job.progress = 100;
        job.status = 'completed';
        job.outputPath = outputPath;
        console.log(`[NexConvert] Job ${jobId} COMPLETED via CloudConvert fallback.`);
        return;
      }
      
      throw new Error('The Pro Engine encountered an error with this specific file.');
    }

    throw new Error('Local engine reached its limit and the Cloud API Key is not configured. Please add CLOUDCONVERT_API_KEY to your Render Environment Variables to support this file type.');

  } catch (error) {
    console.error(`[NexConvert] Job ${jobId} FATAL ERROR:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    job.progress = 0;
  }
}

module.exports = { execute };

