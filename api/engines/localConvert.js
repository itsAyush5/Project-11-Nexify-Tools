/**
 * Nexify Local Conversion Engine
 * Handles conversions that don't need CloudConvert:
 *  - Code / Data:  JSON ↔ YAML ↔ TOML ↔ CSV ↔ XML ↔ NDJSON ↔ JSONL ↔ TSV ↔ TXT ↔ MD ↔ HTML
 *  - Text-passthrough: any text format → txt / md / html
 *  - Plain re-save: same-category text files
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// ── Tiny helpers ─────────────────────────────────────────────────────────────

function readText(p) { return fs.readFileSync(p, 'utf8'); }
function writeText(p, s) { fs.writeFileSync(p, s, 'utf8'); }

// ── JSON ↔ YAML ──────────────────────────────────────────────────────────────
function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) return `"${obj.replace(/"/g, '\\"')}"`;
      return obj;
    }
    return String(obj);
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(v => `${pad}- ${toYaml(v, indent + 1)}`).join('\n');
  }
  return Object.entries(obj).map(([k, v]) => {
    const val = toYaml(v, indent + 1);
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      return `${pad}${k}:\n${val}`;
    }
    if (Array.isArray(v)) {
      return `${pad}${k}:\n${val}`;
    }
    return `${pad}${k}: ${val}`;
  }).join('\n');
}

function parseYaml(text) {
  // Minimal YAML parser — handles simple flat and nested structures
  // For production use, install 'js-yaml' npm package
  try {
    const js_yaml = require('js-yaml');
    return js_yaml.load(text);
  } catch {
    // Fallback: treat as flat key-value
    const result = {};
    for (const line of text.split('\n')) {
      const m = line.match(/^(\s*)(\w[\w\s-]*):\s*(.*)/);
      if (m) result[m[2].trim()] = m[3].trim() || {};
    }
    return result;
  }
}

// ── JSON ↔ TOML ──────────────────────────────────────────────────────────────
function toToml(obj, prefix = '') {
  let flat = '';
  let sections = '';
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v === null || v === undefined) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      sections += `\n[${key}]\n` + toToml(v);
    } else if (Array.isArray(v)) {
      if (v.every(i => typeof i !== 'object')) {
        flat += `${k} = [${v.map(i => JSON.stringify(i)).join(', ')}]\n`;
      } else {
        v.forEach(item => { sections += `\n[[${key}]]\n` + toToml(item); });
      }
    } else {
      flat += `${k} = ${JSON.stringify(v)}\n`;
    }
  }
  return flat + sections;
}

// ── JSON ↔ CSV ────────────────────────────────────────────────────────────────
function jsonArrayToCsv(arr, delimiter = ',') {
  if (!arr.length) return '';
  const headers = Object.keys(arr[0]);
  const rows = arr.map(row =>
    headers.map(h => {
      const v = String(row[h] ?? '');
      return v.includes(delimiter) || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(delimiter)
  );
  return [headers.join(delimiter), ...rows].join('\n');
}

function csvToJsonArray(text, delimiter = ',') {
  const lines = text.trim().split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(delimiter).map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const vals = line.split(delimiter).map(v => v.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

// ── JSON ↔ XML ────────────────────────────────────────────────────────────────
function jsonToXml(obj, tag = 'root', indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null) return `${pad}<${tag}/>\n`;
  if (typeof obj !== 'object') return `${pad}<${tag}>${obj}</${tag}>\n`;
  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, tag, indent)).join('');
  }
  const children = Object.entries(obj).map(([k, v]) => jsonToXml(v, k, indent + 1)).join('');
  return `${pad}<${tag}>\n${children}${pad}</${tag}>\n`;
}

// ── Markdown helpers ──────────────────────────────────────────────────────────
function jsonToMarkdown(obj) {
  const lines = ['# Data Export\n'];
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const headers = Object.keys(obj[0]);
    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');
    obj.forEach(row => {
      lines.push('| ' + headers.map(h => String(row[h] ?? '')).join(' | ') + ' |');
    });
  } else {
    lines.push('```json\n' + JSON.stringify(obj, null, 2) + '\n```');
  }
  return lines.join('\n');
}

function jsonToHtml(obj) {
  const title = 'Data Export';
  let body = '';
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const headers = Object.keys(obj[0]);
    body = `<table border="1" cellpadding="6" cellspacing="0">
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>
  ${obj.map(row => `    <tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('\n')}
  </tbody>
</table>`;
  } else {
    body = `<pre>${JSON.stringify(obj, null, 2)}</pre>`;
  }
  return `<!DOCTYPE html>\n<html><head><title>${title}</title></head>\n<body>\n<h1>${title}</h1>\n${body}\n</body></html>`;
}

// ── Text to PDF helper ────────────────────────────────────────────────────────
async function textToPdf(text, title) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontSize = 10;
  const margin = 50;
  const { width, height } = { width: 595.28, height: 841.89 }; // A4
  
  const lines = text.split('\n');
  const maxCharsPerLine = 85;
  
  let page = pdfDoc.addPage([width, height]);
  let y = height - margin;

  for (let line of lines) {
    // Basic wrapping
    while (line.length > 0) {
      const chunk = line.substring(0, maxCharsPerLine);
      line = line.substring(maxCharsPerLine);
      
      if (y < margin + fontSize) {
        page = pdfDoc.addPage([width, height]);
        y = height - margin;
      }
      
      page.drawText(chunk, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
      y -= fontSize + 2;
    }
  }
  return await pdfDoc.save();
}

// ── MAIN CONVERT ──────────────────────────────────────────────────────────────

const DATA_EXTS = ['json', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'xml', 'ndjson', 'jsonl', 'geojson', 'ini'];
const TEXT_EXTS = ['txt', 'md', 'html', 'htm', 'rst', 'tex', 'abw'];
const CODE_EXTS = ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt', 'sql', 'sh', 'bat', 'ps1', 'css', 'scss', 'sass', 'less', 'vue', 'svelte'];

function canHandle(inputExt, outputExt) {
  const inp = inputExt.replace('.', '').toLowerCase();
  const out = outputExt.replace('.', '').toLowerCase();

  const isTextIn = DATA_EXTS.includes(inp) || TEXT_EXTS.includes(inp) || CODE_EXTS.includes(inp) || inp === 'docx';
  const isTextOut = DATA_EXTS.includes(out) || TEXT_EXTS.includes(out) || CODE_EXTS.includes(out) || out === 'pdf';

  if (isTextIn && isTextOut) return true;

  return false;
}

  // ── Word (DOCX) → PDF / HTML (Offline!) ──────────────────────────────────
  if (inp === 'docx') {
    const mammoth = require('mammoth');
    if (out === 'pdf') {
      const result = await mammoth.convertToHtml({ path: inputPath });
      const pdfBytes = await textToPdf(result.value.replace(/<[^>]*>/g, '\n'), path.basename(inputPath));
      fs.writeFileSync(outputPath, pdfBytes);
      return;
    }
    if (out === 'html') {
      const result = await mammoth.convertToHtml({ path: inputPath });
      writeText(outputPath, result.value);
      return;
    }
    if (out === 'txt') {
        const result = await mammoth.extractRawText({ path: inputPath });
        writeText(outputPath, result.value);
        return;
    }
  }

  // ── Any Text → PDF (Offline!) ──────────────────────────────────────────────
  if (out === 'pdf') {
    const pdfBytes = await textToPdf(text, path.basename(inputPath));
    fs.writeFileSync(outputPath, pdfBytes);
    return;
  }

  // ── CODE → TXT / MD (syntax preserve as code block) ──────────────────────
  if (CODE_EXTS.includes(inp)) {
    if (out === 'txt') {
      writeText(outputPath, text);
      return;
    }
    if (out === 'md') {
      writeText(outputPath, `# ${path.basename(inputPath)}\n\n\`\`\`${inp}\n${text}\n\`\`\`\n`);
      return;
    }
    if (out === 'html') {
      writeText(outputPath, `<!DOCTYPE html><html><head><title>${path.basename(inputPath)}</title></head><body><pre><code class="language-${inp}">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre></body></html>`);
      return;
    }
    // Code → different code extension (rename/passthrough)
    if (CODE_EXTS.includes(out)) {
      writeText(outputPath, text);
      return;
    }
  }

  // ── TEXT ↔ TEXT passthrough ────────────────────────────────────────────────
  if (TEXT_EXTS.includes(inp)) {
    if (out === 'html' && inp === 'md') {
      // Simple MD → HTML
      let html = text
        .replace(/^### (.+)/gm, '<h3>$1</h3>')
        .replace(/^## (.+)/gm, '<h2>$1</h2>')
        .replace(/^# (.+)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>\n');
      writeText(outputPath, `<!DOCTYPE html><html><body>${html}</body></html>`);
      return;
    }
    writeText(outputPath, text);
    return;
  }

  // ── Parse input DATA format ────────────────────────────────────────────────
  let parsed;
  if (inp === 'json' || inp === 'geojson') {
    parsed = JSON.parse(text);
  } else if (inp === 'ndjson' || inp === 'jsonl') {
    parsed = text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  } else if (inp === 'csv') {
    parsed = csvToJsonArray(text, ',');
  } else if (inp === 'tsv') {
    parsed = csvToJsonArray(text, '\t');
  } else if (inp === 'yaml' || inp === 'yml') {
    parsed = parseYaml(text);
  } else if (inp === 'toml') {
    // Basic TOML: treat as flat key=value (robust parsing needs toml npm package)
    try {
      const toml = require('@iarna/toml');
      parsed = toml.parse(text);
    } catch {
      // fallback: parse key = "value" pairs
      parsed = {};
      text.split('\n').forEach(line => {
        const m = line.match(/^(\w+)\s*=\s*(.*)/);
        if (m) { try { parsed[m[1]] = JSON.parse(m[2]); } catch { parsed[m[1]] = m[2]; } }
      });
    }
  } else if (inp === 'ini') {
    parsed = {};
    let section = '_global';
    text.split('\n').forEach(line => {
      const sec = line.match(/^\[(.+)\]/);
      if (sec) { section = sec[1]; parsed[section] = {}; return; }
      const kv = line.match(/^(.+?)\s*=\s*(.*)/);
      if (kv) {
        if (!parsed[section]) parsed[section] = {};
        parsed[section][kv[1].trim()] = kv[2].trim();
      }
    });
  } else if (inp === 'xml') {
    // Minimal: output as JSON string of raw text
    parsed = { _rawXml: text };
  } else {
    // Unknown: treat as plain text → write as-is
    writeText(outputPath, text);
    return;
  }

  // ── Emit output DATA format ────────────────────────────────────────────────
  if (out === 'json' || out === 'geojson') {
    writeText(outputPath, JSON.stringify(parsed, null, 2));
  } else if (out === 'ndjson' || out === 'jsonl') {
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    writeText(outputPath, arr.map(o => JSON.stringify(o)).join('\n'));
  } else if (out === 'yaml' || out === 'yml') {
    writeText(outputPath, toYaml(parsed));
  } else if (out === 'toml') {
    writeText(outputPath, toToml(typeof parsed === 'object' ? parsed : { value: parsed }));
  } else if (out === 'csv') {
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    writeText(outputPath, jsonArrayToCsv(arr, ','));
  } else if (out === 'tsv') {
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    writeText(outputPath, jsonArrayToCsv(arr, '\t'));
  } else if (out === 'xml') {
    writeText(outputPath, `<?xml version="1.0" encoding="UTF-8"?>\n` + jsonToXml(parsed));
  } else if (out === 'md') {
    writeText(outputPath, jsonToMarkdown(parsed));
  } else if (out === 'html' || out === 'htm') {
    writeText(outputPath, jsonToHtml(parsed));
  } else if (out === 'txt') {
    writeText(outputPath, typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
  } else if (out === 'ini') {
    const lines = [];
    if (typeof parsed === 'object') {
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof v === 'object') {
          lines.push(`[${k}]`);
          Object.entries(v).forEach(([sk, sv]) => lines.push(`${sk} = ${sv}`));
        } else {
          lines.push(`${k} = ${v}`);
        }
      });
    }
    writeText(outputPath, lines.join('\n'));
  } else {
    // Fallback: dump as plain JSON text
    writeText(outputPath, JSON.stringify(parsed, null, 2));
  }
}

module.exports = { canHandle, convert, DATA_EXTS, TEXT_EXTS, CODE_EXTS };
