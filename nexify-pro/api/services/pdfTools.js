const { PDFDocument, degrees } = require('pdf-lib');
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

module.exports = { merge, split, rotate, deletePages, extractPages, insertPages, sign, parsePageRanges };
