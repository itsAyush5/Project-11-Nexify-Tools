const engines = [
  {
    name: 'FFmpeg',
    supports: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp', '.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.gif', '.jpg', '.png', '.pdf']
  },
  {
    name: 'ImageMagick',
    supports: ['.jpg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.ico', '.heic', '.avif', '.psd', '.raw', '.pdf']
  },
  {
    name: 'Pandoc',
    supports: ['.docx', '.doc', '.odt', '.rtf', '.txt', '.html', '.md', '.epub', '.mobi', '.pdf']
  },
  {
    name: 'LibreOffice',
    supports: ['.docx', '.doc', '.odt', '.rtf', '.xlsx', '.xls', '.ods', '.pptx', '.ppt', '.pdf', '.jpg', '.png']
  },
  {
    name: 'Scientific',
    supports: ['.json', '.xml', '.yaml', '.csv', '.tsv', '.txt']
  }
];

let capabilityGraph = {};

function buildGraph() {
  const formats = new Set();
  engines.forEach(engine => engine.supports.forEach(f => formats.add(f.toLowerCase())));

  capabilityGraph = {};
  formats.forEach(f => capabilityGraph[f] = []);

  engines.forEach(engine => {
    engine.supports.forEach(input => {
      engine.supports.forEach(output => {
        if (input.toLowerCase() !== output.toLowerCase()) {
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

buildGraph();

export const getAvailableOutputs = (inputFormat) => {
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

  return Object.keys(paths).map(format => ({
    format,
    path: paths[format].join(' → ')
  }));
};

export const simulateAnalysis = (file) => {
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const availableOutputs = getAvailableOutputs(extension);

  return {
    fileId: 'mock-' + Math.random().toString(36).substr(2, 9),
    originalName: file.name,
    mimeType: file.type,
    extension,
    availableOutputs
  };
};

export const simulateConversion = async (fileId, targetFormat, onProgress) => {
  for (let i = 10; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress(i);
  }
  return { status: 'completed' };
};
