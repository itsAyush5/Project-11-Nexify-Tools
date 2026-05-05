const { PDFDocument, degrees, rgb, StandardFonts, PageSizes } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Helper: parse page ranges like "1-3, 5, 7-9" → [0,1,2,4,6,7,8] (0-indexed)
function parsePageRanges(rangeStr, totalPages) {
  const indices = new Set();
  const parts = rangeStr.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= Math.min(end, totalPages); i++) {
        if (i >= 1) indices.add(i - 1);
      }
    } else {
      const n = parseInt(part);
      if (!isNaN(n) && n >= 1 && n <= totalPages) indices.add(n - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

// MERGE: combine multiple PDF files into one
async function merge(inputPaths, outputPath) {
  try {
    const merged = await PDFDocument.create();
    for (const inputPath of inputPaths) {
      if (!fs.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`);
      const bytes = fs.readFileSync(inputPath);
      const doc = await PDFDocument.load(bytes);
      const copiedPages = await merged.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(p => merged.addPage(p));
    }
    const pdfBytes = await merged.save();
    fs.writeFileSync(outputPath, pdfBytes);
  } catch (err) {
    console.error('[PDF Merge Service]', err.message);
    throw err;
  }
}

// SPLIT: split a PDF into chunks by page ranges
// ranges: array of range strings e.g. ["1-3", "4-6"]
// returns: array of output file paths
async function split(inputPath, ranges, outputDir, jobId) {
  try {
    const bytes = fs.readFileSync(inputPath);
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();
    const outputs = [];

    for (let i = 0; i < ranges.length; i++) {
      const indices = parsePageRanges(ranges[i], totalPages);
      if (indices.length === 0) continue;
      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(doc, indices);
      copiedPages.forEach(p => newDoc.addPage(p));
      const outPath = path.join(outputDir, `${jobId}-part${i + 1}.pdf`);
      fs.writeFileSync(outPath, await newDoc.save());
      outputs.push(outPath);
    }
    return outputs;
  } catch (err) {
    console.error('[PDF Split Service]', err.message);
    throw err;
  }
}

// ROTATE: rotate specific pages (or all) by given degrees (90, 180, 270)
async function rotate(inputPath, outputPath, pageRange, rotateDegrees) {
  try {
    const bytes = fs.readFileSync(inputPath);
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    const indices = (pageRange === 'all' || !pageRange)
      ? [...Array(totalPages).keys()]
      : parsePageRanges(pageRange, totalPages);

    for (const i of indices) {
      const page = doc.getPage(i);
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rotateDegrees) % 360));
    }
    fs.writeFileSync(outputPath, await doc.save());
  } catch (err) {
    console.error('[PDF Rotate Service]', err.message);
    throw err;
  }
}

// DELETE PAGES: remove specific pages from a PDF
async function deletePages(inputPath, outputPath, pageRange) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const totalPages = doc.getPageCount();
  const toDelete = new Set(parsePageRanges(pageRange, totalPages));

  const keepIndices = [...Array(totalPages).keys()].filter(i => !toDelete.has(i));
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(doc, keepIndices);
  copiedPages.forEach(p => newDoc.addPage(p));
  fs.writeFileSync(outputPath, await newDoc.save());
}

// EXTRACT PAGES: keep only specific pages
async function extractPages(inputPath, outputPath, pageRange) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const totalPages = doc.getPageCount();
  const indices = parsePageRanges(pageRange, totalPages);

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(doc, indices);
  copiedPages.forEach(p => newDoc.addPage(p));
  fs.writeFileSync(outputPath, await newDoc.save());
}

// INSERT: insert pages from a second PDF into the first at a position
async function insertPages(basePath, insertPath, outputPath, position) {
  const baseBytes = fs.readFileSync(basePath);
  const insertBytes = fs.readFileSync(insertPath);
  const baseDoc = await PDFDocument.load(baseBytes);
  const insertDoc = await PDFDocument.load(insertBytes);

  const insertedPages = await baseDoc.copyPages(insertDoc, insertDoc.getPageIndices());

  // Insert at position (1-indexed → convert to 0-indexed)
  const insertAt = Math.max(0, Math.min(position - 1, baseDoc.getPageCount()));
  insertedPages.reverse().forEach(p => baseDoc.insertPage(insertAt, p));

  fs.writeFileSync(outputPath, await baseDoc.save());
}

// SIGN: embed a signature image into a PDF at a specific page and position
async function sign(inputPath, outputPath, signatureImagePath, pageIndex, x, y, width, height) {
  const bytes = fs.readFileSync(inputPath);
  const signatureBytes = fs.readFileSync(signatureImagePath);
  
  const doc = await PDFDocument.load(bytes);
  let signatureImage;
  
  if (signatureImagePath.endsWith('.png')) {
    signatureImage = await doc.embedPng(signatureBytes);
  } else {
    signatureImage = await doc.embedJpg(signatureBytes);
  }

  const page = doc.getPage(pageIndex);
  page.drawImage(signatureImage, {
    x,
    y,
    width,
    height,
  });

  fs.writeFileSync(outputPath, await doc.save());
}

// IMAGES TO PDF: Combine multiple images into a single PDF
async function imagesToPdf(imagePaths, outputPath) {
  const doc = await PDFDocument.create();
  for (const imgPath of imagePaths) {
    const bytes = fs.readFileSync(imgPath);
    let image;
    const lowerPath = imgPath.toLowerCase();
    if (lowerPath.endsWith('.png')) {
      image = await doc.embedPng(bytes);
    } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
      image = await doc.embedJpg(bytes);
    } else {
      continue; // Skip unsupported
    }
    
    // Scale to A4 size
    const page = doc.addPage(PageSizes.A4);
    const { width, height } = image.scaleToFit(page.getWidth() - 40, page.getHeight() - 40);
    page.drawImage(image, {
      x: page.getWidth() / 2 - width / 2,
      y: page.getHeight() / 2 - height / 2,
      width,
      height,
    });
  }
  fs.writeFileSync(outputPath, await doc.save());
}

// WATERMARK: Add text diagonally across all pages
async function addWatermark(inputPath, outputPath, text) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textSize = 50;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: textSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.3,
      rotate: degrees(45),
    });
  }
  fs.writeFileSync(outputPath, await doc.save());
}

// PAGE NUMBERS: Add "Page X of Y" to the bottom of all pages
async function addPageNumbers(inputPath, outputPath) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  pages.forEach((page, idx) => {
    const text = `Page ${idx + 1} of ${pages.length}`;
    const textSize = 12;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    page.drawText(text, {
      x: page.getWidth() / 2 - textWidth / 2,
      y: 20,
      size: textSize,
      font: font,
      color: rgb(0, 0, 0),
    });
  });
  fs.writeFileSync(outputPath, await doc.save());
}

// EDIT METADATA: Change internal PDF properties
async function editMetadata(inputPath, outputPath, metadata) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  
  if (metadata.title) doc.setTitle(metadata.title);
  if (metadata.author) doc.setAuthor(metadata.author);
  if (metadata.subject) doc.setSubject(metadata.subject);
  if (metadata.keywords) doc.setKeywords(metadata.keywords.split(',').map(k => k.trim()));
  
  fs.writeFileSync(outputPath, await doc.save());
}

// FLATTEN: Lock interactive forms so they are no longer editable
async function flattenForm(inputPath, outputPath) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  
  const form = doc.getForm();
  form.flatten();
  
  fs.writeFileSync(outputPath, await doc.save());
}

// COMPRESS PDF: Re-save with object compression to reduce file size
async function compress(inputPath, outputPath) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  // Save with object streams for compact cross-reference tables
  const compressedBytes = await doc.save({ useObjectStreams: true });
  fs.writeFileSync(outputPath, compressedBytes);
}

// REVERSE PAGES: Flip the page order of a PDF
async function reversePages(inputPath, outputPath) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const totalPages = doc.getPageCount();
  const newDoc = await PDFDocument.create();
  const reversed = [...Array(totalPages).keys()].reverse();
  const copiedPages = await newDoc.copyPages(doc, reversed);
  copiedPages.forEach(p => newDoc.addPage(p));
  fs.writeFileSync(outputPath, await newDoc.save());
}

// DUPLICATE PAGES: Duplicate specific pages N times
async function duplicatePages(inputPath, outputPath, pageRange, times) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const totalPages = doc.getPageCount();
  const indices = parsePageRanges(pageRange, totalPages);
  const newDoc = await PDFDocument.create();

  // Copy all pages first
  const allCopied = await newDoc.copyPages(doc, doc.getPageIndices());
  allCopied.forEach(p => newDoc.addPage(p));

  // Duplicate the selected pages `times` more
  for (let t = 0; t < times; t++) {
    const extra = await newDoc.copyPages(doc, indices);
    extra.forEach(p => newDoc.addPage(p));
  }
  fs.writeFileSync(outputPath, await newDoc.save());
}

// ADD BLANK PAGE: Insert a blank page at a specific position (1-indexed)
async function addBlankPage(inputPath, outputPath, position, pageSize = 'A4') {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const insertAt = Math.max(0, Math.min(parseInt(position) - 1, doc.getPageCount()));
  const size = PageSizes[pageSize] || PageSizes.A4;
  doc.insertPage(insertAt, size);
  fs.writeFileSync(outputPath, await doc.save());
}

// CROP PAGES: Adjust the visible area of every page by trimming margins
async function cropPages(inputPath, outputPath, marginTop, marginRight, marginBottom, marginLeft) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const t = parseFloat(marginTop)   || 0;
  const r = parseFloat(marginRight)  || 0;
  const b = parseFloat(marginBottom) || 0;
  const l = parseFloat(marginLeft)   || 0;

  for (const page of pages) {
    const { x, y, width, height } = page.getMediaBox();
    page.setCropBox(x + l, y + b, width - l - r, height - t - b);
  }
  fs.writeFileSync(outputPath, await doc.save());
}

// ADD HEADER / FOOTER: Stamp header and/or footer text across all pages
async function addHeaderFooter(inputPath, outputPath, header, footer) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const textSize = 11;

  for (const page of pages) {
    const { width, height } = page.getSize();
    if (header) {
      const w = font.widthOfTextAtSize(header, textSize);
      page.drawText(header, {
        x: width / 2 - w / 2,
        y: height - 25,
        size: textSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    if (footer) {
      const w = font.widthOfTextAtSize(footer, textSize);
      page.drawText(footer, {
        x: width / 2 - w / 2,
        y: 12,
        size: textSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }
  fs.writeFileSync(outputPath, await doc.save());
}

module.exports = { 
  merge, split, rotate, deletePages, extractPages, insertPages, sign, parsePageRanges,
  imagesToPdf, addWatermark, addPageNumbers, editMetadata, flattenForm,
  compress, reversePages, duplicatePages, addBlankPage, cropPages, addHeaderFooter,
};
