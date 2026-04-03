const cloudConvert = require('../engines/cloudConvert');

const engines = [
  {
    name: 'CloudConvert (Pro)',
    supports: cloudConvert.supports,
    isAvailable: cloudConvert.isConfigured
  },
  {
    name: 'FFmpeg',
    supports: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp', '.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.gif', '.jpg', '.png', '.pdf'],
    isAvailable: true
  },
  {
    name: 'ImageMagick',
    supports: ['.jpg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.ico', '.heic', '.avif', '.psd', '.raw', '.pdf'],
    isAvailable: true
  },
  {
    name: 'Pandoc',
    supports: ['.docx', '.doc', '.odt', '.rtf', '.txt', '.html', '.md', '.epub', '.mobi', '.pdf'],
    isAvailable: true
  },
  {
    name: 'LibreOffice',
    supports: ['.docx', '.doc', '.odt', '.rtf', '.xlsx', '.xls', '.ods', '.pptx', '.ppt', '.pdf', '.jpg', '.png'],
    isAvailable: true
  },
  {
    name: 'Scientific',
    supports: ['.json', '.xml', '.yaml', '.csv', '.tsv', '.txt'],
    isAvailable: true
  }
];

let capabilityGraph = {};

function initialize() {
  console.log('Initializing Nexify Capability Engine...');
  buildGraph();
}

function buildGraph() {
  const formats = new Set();
  engines.forEach(engine => engine.supports.forEach(f => formats.add(f.toLowerCase())));

  capabilityGraph = {};
  formats.forEach(f => capabilityGraph[f] = []);

  engines.forEach(engine => {
    engine.supports.forEach(input => {
      engine.supports.forEach(output => {
        if (input !== output) {
          const inp = input.toLowerCase();
          const out = output.toLowerCase();
          if (!capabilityGraph[inp].includes(out)) {
            capabilityGraph[inp].push(out);
          }
        }
      });
    });
  });
}

function getAvailableOutputs(inputFormat) {
  const start = inputFormat.toLowerCase();
  if (!capabilityGraph[start]) return [];

  const queue = [[start]];
  const seen = new Set([start]);
  const paths = {};

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (capabilityGraph[node]) {
      for (const neighbor of capabilityGraph[node]) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          const newPath = [...path, neighbor];
          paths[neighbor] = newPath;
          queue.push(newPath);
        }
      }
    }
  }

  // Filter to return format and the path used to get there
  return Object.keys(paths).map(format => ({
    format,
    path: paths[format].join(' → ')
  }));
}

module.exports = {
  initialize,
  getAvailableOutputs,
  capabilityGraph
};
