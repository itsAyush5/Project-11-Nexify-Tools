/**
 * Nexify Mock Engine — Category-aware conversion capability graph (client-side)
 * Only suggests semantically valid conversions for each file type.
 * Excludes the input format AND its aliases from available outputs.
 */

// ── Format categories ──────────────────────────────────────────────────────
const FORMAT_CATEGORIES = {
  image: [
    '.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif',
    '.ico', '.avif', '.svg', '.heic', '.heif', '.psd', '.raw', '.arw',
    '.cr2', '.nef', '.dng', '.eps', '.ai', '.xcf', '.jxl', '.exr', '.hdr',
  ],
  video: [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp',
    '.m4v', '.ts', '.mts', '.m2ts', '.vob', '.ogv', '.f4v', '.asf',
    '.rm', '.rmvb', '.divx', '.mpg', '.mpeg', '.mxf', '.dv', '.amv',
    '.gif',
  ],
  audio: [
    '.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.opus',
    '.aiff', '.aif', '.ape', '.wv', '.mka', '.mid', '.midi',
    '.ra', '.amr', '.ac3', '.dts', '.caf', '.spx', '.mpc',
  ],
  document: [
    '.pdf', '.docx', '.doc', '.odt', '.rtf', '.txt', '.md', '.html',
    '.htm', '.epub', '.mobi', '.azw', '.azw3', '.fb2', '.djvu',
    '.xps', '.pages', '.wpd', '.abw', '.tex', '.rst',
  ],
  data: [
    '.json', '.xml', '.yaml', '.yml', '.csv', '.tsv', '.toml',
    '.ini', '.ndjson', '.jsonl', '.geojson', '.xlsx',
  ],
  archive: [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    '.tgz', '.tbz2', '.lz4', '.zst', '.cab', '.iso', '.deb', '.rpm',
  ],
  spreadsheet: [
    '.xlsx', '.xls', '.ods', '.csv', '.tsv', '.numbers',
    '.xlsm', '.xlsb', '.xltx',
  ],
  presentation: [
    '.pptx', '.ppt', '.odp', '.key', '.pps', '.ppsx', '.potx',
  ],
  ebook: [
    '.epub', '.mobi', '.azw', '.azw3', '.fb2', '.lit', '.lrf',
    '.pdb', '.txt', '.html', '.pdf',
  ],
  font: [
    '.ttf', '.otf', '.woff', '.woff2', '.eot', '.svg',
  ],
  code: [
    '.html', '.htm', '.css', '.js', '.ts', '.jsx', '.tsx',
    '.py', '.rb', '.php', '.java', '.c', '.cpp', '.cs', '.go',
    '.rs', '.swift', '.kt', '.sql', '.sh', '.bat', '.ps1',
    '.json', '.xml', '.yaml', '.yml', '.toml', '.md', '.txt',
  ],
  vector: [
    '.svg', '.ai', '.eps', '.pdf', '.dxf', '.cdr', '.emf', '.wmf',
    '.png', '.jpg',
  ],
};

// ── Cross-category rules ──────────────────────────────────────────────────
const CROSS_CATEGORY_RULES = {
  image:        ['image', 'document', 'vector'],
  video:        ['video', 'audio'],
  audio:        ['audio'],
  document:     ['document', 'image', 'ebook'],
  data:         ['data', 'document', 'spreadsheet'],
  archive:      ['archive'],
  spreadsheet:  ['spreadsheet', 'data', 'document'],
  presentation: ['presentation', 'document', 'image'],
  ebook:        ['ebook', 'document'],
  font:         ['font'],
  code:         ['code', 'document'],
  vector:       ['vector', 'image'],
};

// ── Format aliases: functionally identical formats ────────────────────────
const ALIAS_GROUPS = [
  ['.jpg', '.jpeg', '.jfif'],
  ['.yaml', '.yml'],
  ['.htm', '.html'],
  ['.tif', '.tiff'],
  ['.heic', '.heif'],
  ['.aif', '.aiff'],
];

const ALIAS_MAP = new Map();
for (const group of ALIAS_GROUPS) {
  const groupSet = new Set(group);
  for (const ext of group) {
    ALIAS_MAP.set(ext, groupSet);
  }
}

// ── Build reverse lookup: extension → category ────────────────────────────
const EXT_TO_CATEGORY = {};
for (const [cat, exts] of Object.entries(FORMAT_CATEGORIES)) {
  for (const ext of exts) {
    EXT_TO_CATEGORY[ext.toLowerCase()] = cat;
  }
}

// ── Capability resolution ─────────────────────────────────────────────────
export const getAvailableOutputs = (inputFormat) => {
  // Normalise to ".ext" form
  let ext = inputFormat.toLowerCase();
  if (!ext.startsWith('.')) ext = '.' + ext;

  const sourceCategory = EXT_TO_CATEGORY[ext];
  if (!sourceCategory) return [];

  // Build exclusion set: input format + all its aliases
  const excluded = ALIAS_MAP.get(ext) || new Set([ext]);

  const allowedCategories = CROSS_CATEGORY_RULES[sourceCategory] || [sourceCategory];

  const seen = new Set();
  const results = [];

  for (const cat of allowedCategories) {
    for (const fmt of FORMAT_CATEGORIES[cat] || []) {
      if (excluded.has(fmt) || seen.has(fmt)) continue;
      seen.add(fmt);
      results.push({
        format: fmt.replace('.', ''),   // without leading dot, e.g. "png"
        path: `${ext} → ${fmt}`,
      });
    }
  }

  return results;
};

// ── Analysis ─────────────────────────────────────────────────────────────
export const simulateAnalysis = (file) => {
  const rawExt = '.' + file.name.split('.').pop().toLowerCase();
  const availableOutputs = getAvailableOutputs(rawExt);
  const category = EXT_TO_CATEGORY[rawExt] || 'unknown';

  return {
    fileId: 'mock-' + Math.random().toString(36).substr(2, 9),
    originalName: file.name,
    mimeType: file.type,
    extension: rawExt,
    category,
    availableOutputs,
  };
};

// ── Simulation ────────────────────────────────────────────────────────────
export const simulateConversion = async (fileId, targetFormat, onProgress) => {
  for (let i = 10; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 400));
    onProgress(i);
  }
  return { status: 'completed' };
};
