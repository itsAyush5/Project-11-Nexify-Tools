/**
 * Nexify Capability Engine — Category-aware format mapping (backend)
 * Only suggests semantically valid output formats for each input file type.
 * Excludes the input format AND its aliases from available outputs.
 */

// ── Format categories ──────────────────────────────────────────────────────
const FORMAT_CATEGORIES = {
  image: [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif',
    '.ico', '.avif', '.svg', '.heic', '.heif', '.psd', '.raw', '.arw',
    '.cr2', '.nef', '.dng', '.eps', '.ai', '.indd', '.xcf', '.jfif',
    '.jxl', '.qoi', '.exr', '.hdr',
  ],
  video: [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp',
    '.m4v', '.ts', '.mts', '.m2ts', '.vob', '.ogv', '.f4v', '.asf',
    '.rm', '.rmvb', '.divx', '.mpg', '.mpeg', '.mxf', '.dv', '.amv',
    '.gif',  // animated gif is sometimes a video output
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
    '.tgz', '.tbz2', '.tar.gz', '.tar.bz2', '.lz4', '.zst',
    '.cab', '.iso', '.dmg', '.deb', '.rpm',
  ],
  spreadsheet: [
    '.xlsx', '.xls', '.ods', '.csv', '.tsv', '.numbers',
    '.xlsm', '.xlsb', '.xltx', '.ods',
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
    '.scss', '.sass', '.less', '.vue', '.svelte', '.jsonc', '.json5',
    '.env', '.gitignore', '.dockerignore', '.editorconfig',
  ],
  vector: [
    '.svg', '.ai', '.eps', '.pdf', '.dxf', '.cdr', '.emf', '.wmf',
    '.vsd', '.drawio', '.png', '.jpg',
  ],
};

// ── Cross-category rules ────────────────────────────────────────────────────
const CROSS_CATEGORY_RULES = {
  image:        ['image', 'document', 'vector'],
  video:        ['video', 'audio'],
  audio:        ['audio'],
  document:     ['document', 'image', 'ebook', 'code'],
  data:         ['data', 'document', 'spreadsheet'],
  archive:      ['archive'],
  spreadsheet:  ['spreadsheet', 'data', 'document'],
  presentation: ['presentation', 'document', 'image'],
  ebook:        ['ebook', 'document'],
  font:         ['font'],
  code:         ['code', 'document'],
  vector:       ['vector', 'image'],
};


// ── Format aliases: formats that are functionally identical ─────────────────
// If the input is any member of an alias group, ALL members are excluded from output.
const ALIAS_GROUPS = [
  ['.jpg', '.jpeg', '.jfif'],
  ['.yaml', '.yml'],
  ['.tif', '.tiff'],
  ['.htm', '.html'],
  ['.heic', '.heif'],
  ['.tar.gz', '.tgz'],
  ['.tar.bz2', '.tbz2'],
  ['.aif', '.aiff'],
];

// Build a fast alias lookup: '.jpg' → Set(['.jpg', '.jpeg'])
const ALIAS_MAP = new Map();
for (const group of ALIAS_GROUPS) {
  const groupSet = new Set(group);
  for (const ext of group) {
    ALIAS_MAP.set(ext, groupSet);
  }
}

// ── Reverse lookup: extension → category ───────────────────────────────────
const EXT_TO_CATEGORY = {};
for (const [cat, exts] of Object.entries(FORMAT_CATEGORIES)) {
  for (const ext of exts) {
    EXT_TO_CATEGORY[ext.toLowerCase()] = cat;
  }
}

let initialized = false;

function initialize() {
  console.log('Initializing Nexify Capability Engine (category-aware)...');
  initialized = true;
}

function getAvailableOutputs(inputFormat) {
  // Normalise: ".jpg" or "jpg" → ".jpg"
  let ext = inputFormat.toLowerCase();
  if (!ext.startsWith('.')) ext = '.' + ext;

  const sourceCategory = EXT_TO_CATEGORY[ext];
  if (!sourceCategory) return [];   // unknown/unsupported format

  // Build the full exclusion set: input format + all its aliases
  const excluded = ALIAS_MAP.get(ext) || new Set([ext]);

  const allowedCategories = CROSS_CATEGORY_RULES[sourceCategory] || [sourceCategory];

  const seen = new Set();
  const results = [];

  for (const cat of allowedCategories) {
    for (const fmt of FORMAT_CATEGORIES[cat] || []) {
      // Skip if fmt is the input format, an alias of it, or already added
      if (excluded.has(fmt) || seen.has(fmt)) continue;
      seen.add(fmt);
      results.push({
        format: fmt,        // e.g. ".png"
        path:   `${ext} → ${fmt}`,
      });
    }
  }

  return results;
}

module.exports = {
  initialize,
  getAvailableOutputs,
  EXT_TO_CATEGORY,
  FORMAT_CATEGORIES,
};
