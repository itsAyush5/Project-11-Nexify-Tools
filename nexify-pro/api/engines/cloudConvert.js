const CloudConvert = require('cloudconvert');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const apiKey = process.env.CLOUDCONVERT_API_KEY || '';
const cloudConvertClient = apiKey ? new CloudConvert(apiKey) : null;

async function convert(inputPath, outputPath, targetFormat, onProgress) {
  if (!cloudConvertClient) {
    throw new Error('CloudConvert API Key not configured. Please set CLOUDCONVERT_API_KEY in api/.env');
  }

  console.log(`[CloudConvert] Creating job: ${path.basename(inputPath)} → ${targetFormat}`);

  // Create the conversion job
  const job = await cloudConvertClient.jobs.create({
    tasks: {
      'upload-file': {
        operation: 'import/upload',
      },
      'convert-file': {
        operation: 'convert',
        input: ['upload-file'],
        output_format: targetFormat.toLowerCase(),
        some_option: true,
      },
      'export-file': {
        operation: 'export/url',
        input: ['convert-file'],
      },
    },
  });

  // Find the upload task and upload the file
  const uploadTask = job.tasks.find(t => t.name === 'upload-file');
  if (!uploadTask) throw new Error('Upload task not found in CloudConvert job');

  console.log(`[CloudConvert] Uploading file to job ${job.id}...`);
  const inputStream = fs.createReadStream(inputPath);
  await cloudConvertClient.tasks.upload(uploadTask, inputStream, path.basename(inputPath));

  onProgress && onProgress(20);

  // Poll for completion
  const completedJob = await cloudConvertClient.jobs.wait(job.id);
  onProgress && onProgress(80);
  
  // Find the export task and download the result
  const exportTask = completedJob.tasks.find(t => t.name === 'export-file');
  if (!exportTask) throw new Error('Export task not found in CloudConvert job');
  
  if (exportTask.status === 'error') {
     const errorTask = completedJob.tasks.find(t => t.status === 'error');
     throw new Error(`CloudConvert task failed: ${errorTask?.message || 'Unknown error'}`);
  }

  if (!exportTask.result || !exportTask.result.files || !exportTask.result.files.length) {
    throw new Error('No output file found in CloudConvert result');
  }

  const outputFile = exportTask.result.files[0];
  console.log(`[CloudConvert] Downloading result: ${outputFile.filename}`);

  const response = await axios({
    method: 'GET',
    url: outputFile.url,
    responseType: 'stream',
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  onProgress && onProgress(100);
  console.log(`[CloudConvert] File saved to ${outputPath}`);
}

// Full list of formats supported by CloudConvert
const supports = [
  // Documents
  '.pdf', '.docx', '.doc', '.odt', '.rtf', '.txt', '.html', '.md', '.epub', '.mobi', '.azw3',
  // Spreadsheets
  '.xlsx', '.xls', '.ods', '.csv', '.tsv',
  // Presentations
  '.pptx', '.ppt', '.odp',
  // Images
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.ico', '.heic', '.avif', '.psd',
  // Video
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  // Audio
  '.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma',
  // CAD
  '.dwg', '.dxf', '.stl', '.obj', '.fbx', '.step',
  // Archives
  '.zip', '.rar', '.tar', '.gz', '.7z',
];

async function protect(inputPath, outputPath, password, onProgress) {
  if (!cloudConvertClient) throw new Error('CloudConvert API Key not configured.');
  
  const job = await cloudConvertClient.jobs.create({
    tasks: {
      'upload': { operation: 'import/upload' },
      'protect': {
         operation: 'pdf/optimize', // Optimize handles protection options
         input: ['upload'],
         protect_user_password: password,
         protect_owner_password: password,
         protect_permissions: 'none'
      },
      'export': { operation: 'export/url', input: ['protect'] }
    }
  });

  const uploadTask = job.tasks.find(t => t.name === 'upload');
  await cloudConvertClient.tasks.upload(uploadTask, fs.createReadStream(inputPath), path.basename(inputPath));
  onProgress && onProgress(30);

  const completedJob = await cloudConvertClient.jobs.wait(job.id);
  onProgress && onProgress(80);

  const exportTask = completedJob.tasks.find(t => t.name === 'export');
  if (!exportTask || exportTask.status === 'error') {
     const errorTask = completedJob.tasks.find(t => t.status === 'error');
     throw new Error(`CloudConvert protect failed: ${errorTask?.message || 'Unknown error'}`);
  }

  if (!exportTask.result || !exportTask.result.files || !exportTask.result.files.length) {
    throw new Error('No output files found in CloudConvert result');
  }

  const url = exportTask.result.files[0].url;
  const res = await axios({ method: 'GET', url, responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    res.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  onProgress && onProgress(100);
}

async function unlock(inputPath, outputPath, password, onProgress) {
  if (!cloudConvertClient) throw new Error('CloudConvert API Key not configured.');
  
  const job = await cloudConvertClient.jobs.create({
    tasks: {
      'upload': { operation: 'import/upload' },
      'unlock': {
         operation: 'convert',
         input: ['upload'],
         input_password: password,
         output_format: 'pdf'
      },
      'export': { operation: 'export/url', input: ['unlock'] }
    }
  });

  const uploadTask = job.tasks.find(t => t.name === 'upload');
  await cloudConvertClient.tasks.upload(uploadTask, fs.createReadStream(inputPath), path.basename(inputPath));
  onProgress && onProgress(30);

  const completedJob = await cloudConvertClient.jobs.wait(job.id);
  onProgress && onProgress(80);

  const exportTask = completedJob.tasks.find(t => t.name === 'export');
  if (!exportTask || exportTask.status === 'error') {
     const errorTask = completedJob.tasks.find(t => t.status === 'error');
     throw new Error(`CloudConvert unlock failed: ${errorTask?.message || 'Unknown error'}`);
  }

  const url = exportTask.result.files[0].url;
  const res = await axios({ method: 'GET', url, responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    res.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  onProgress && onProgress(100);
}

module.exports = {
  convert,
  protect,
  unlock,
  supports,
  isConfigured: !!cloudConvertClient,
};
