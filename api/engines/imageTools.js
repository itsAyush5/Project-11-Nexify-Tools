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
 * PDF to Image conversion
 * Converts PDF pages to JPG/PNG
 */
async function pdfToImage(inputPath, outputPath, format = 'png') {
  // Using pdf-img-convert (pure JS implementation)
  const pdfImgConvert = require('pdf-img-convert');
  const outputImages = await pdfImgConvert.convert(inputPath);
  
  // For now, we take the first page as the primary output
  if (outputImages.length > 0) {
    fs.writeFileSync(outputPath, outputImages[0]);
  } else {
    throw new Error('No pages found in PDF');
  }
}

module.exports = { traceToSvg, pdfToImage };
