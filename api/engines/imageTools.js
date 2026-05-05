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
 * PDF to Image conversion using FFmpeg (Stable & Cloud-Safe)
 */
async function pdfToImage(inputPath, outputPath, format = 'png') {
  const ffmpeg = require('fluent-ffmpeg');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => {
        console.error('[pdfToImage] FFmpeg Error:', err.message);
        reject(new Error('Failed to render PDF page. Make sure the file is not password protected.'));
      })
      .run();
  });
}

module.exports = { traceToSvg, pdfToImage };
