const pdfTools = require('./api/services/pdfTools');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function test() {
  try {
    console.log('Testing PDF Tools...');
    
    // Create a dummy PDF
    const doc = await PDFDocument.create();
    doc.addPage([600, 400]);
    const bytes = await doc.save();
    fs.writeFileSync('test1.pdf', bytes);
    fs.writeFileSync('test2.pdf', bytes);
    
    // Test Merge
    console.log('Testing Merge...');
    await pdfTools.merge(['test1.pdf', 'test2.pdf'], 'merged_test.pdf');
    console.log('Merge Success');
    
    // Test Split
    console.log('Testing Split...');
    const splitOutputs = await pdfTools.split('test1.pdf', ['1'], '.', 'testjob');
    console.log('Split Success:', splitOutputs);
    
    // Test Rotate
    console.log('Testing Rotate...');
    await pdfTools.rotate('test1.pdf', 'rotated_test.pdf', '1', 90);
    console.log('Rotate Success');
    
    console.log('All local PDF tests passed!');
  } catch (e) {
    console.error('Test Failed:', e);
  } finally {
    // Cleanup
    ['test1.pdf', 'test2.pdf', 'merged_test.pdf', 'testjob-part1.pdf', 'rotated_test.pdf'].forEach(f => {
       if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  }
}

test();
