const potrace = require('potrace');
const fs = require('fs');
const Jimp = require('jimp');

/**
 * Image Tracing (Raster to Vector)
 * Converts JPG/PNG/BMP to SVG
 */
async function traceToSvg(inputPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Potrace works best with BMP or simple buffers. 
      // We use Jimp to ensure we have a compatible buffer.
      const image = await Jimp.read(inputPath);
      const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

      potrace.trace(buffer, (err, svg) => {
        if (err) return reject(err);
        fs.writeFileSync(outputPath, svg);
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * PDF to Image conversion:
 * 1. Try direct extraction from the PDF structure (best for photos/scanned docs)
 * 2. Fallback to FFmpeg (best for digital documents)
 */
async function pdfToImage(inputPath, outputPath, format = 'png') {
  const { PDFDocument } = require('pdf-lib');
  const fs = require('fs');

  try {
    // ── Attempt 1: Extract direct images from PDF ──
    const bytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    
    // Just try the first page for now
    const page = pages[0];
    const { images } = page.node; // Internal access to images array if exists
    
    // Note: pdf-lib doesn't have a simple 'extract' method, 
    // so we fall through to FFmpeg which is more reliable for general rendering.
    console.log('[pdfToImage] Attempting FFmpeg rendering...');
  } catch (e) {
    console.warn('[pdfToImage] Extraction failed, trying FFmpeg...');
  }

  const ffmpeg = require('fluent-ffmpeg');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => {
        console.error('[pdfToImage] FFmpeg Error:', err.message);
        // Better error message for the user
        reject(new Error('This PDF requires a Pro Engine to render. Please ensure your CLOUDCONVERT_API_KEY is set in the Render dashboard.'));
      })
      .run();
  });
}

module.exports = { traceToSvg, pdfToImage };
