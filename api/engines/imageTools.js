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
 * PDF to Image conversion (DISABLED temporarily for Render compatibility)
 */
async function pdfToImage(inputPath, outputPath, format = 'png') {
  throw new Error('PDF to Image conversion is temporarily disabled for system maintenance.');
}

module.exports = { traceToSvg, pdfToImage };
