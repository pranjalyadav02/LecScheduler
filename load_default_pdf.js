#!/usr/bin/env node

/**
 * AUTO-LOAD DEFAULT PDF SCRIPT
 * 
 * This script helps load the default MCA timetable PDF and prepare it for parsing.
 * The PDF will be read and converted to Base64 for upload via the admin interface.
 * 
 * Usage: node load_default_pdf.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_PDF_PATH = 'C:\\Users\\omen\\Downloads\\Updated_MCA_TT_Jan_May_12012026 (1).pdf';
const SEMESTER_ID = 'mca-sem1-jan2026'; // Update based on your semester ID

console.log('🔍 PDF Auto-Load Helper Script\n');

// Check if file exists
if (!fs.existsSync(DEFAULT_PDF_PATH)) {
    console.error('❌ Error: PDF file not found at:');
    console.error(`   ${DEFAULT_PDF_PATH}\n`);
    console.log('ℹ️  Please ensure the PDF is in your Downloads folder.');
    console.log('📋 Expected file name: Updated_MCA_TT_Jan_May_12012026 (1).pdf\n');
    process.exit(1);
}

// Read the PDF file
console.log('📖 Reading PDF file...');
const pdfBuffer = fs.readFileSync(DEFAULT_PDF_PATH);
const base64Data = pdfBuffer.toString('base64');
const fileSize = (pdfBuffer.length / 1024 / 1024).toFixed(2);

console.log(`✅ PDF loaded successfully (${fileSize} MB)\n`);

// Create a JSON object with the PDF data
const pdfData = {
    filename: path.basename(DEFAULT_PDF_PATH),
    semesterId: SEMESTER_ID,
    fileSize: fileSize + ' MB',
    base64: base64Data.substring(0, 100) + '... (truncated in display)',
    timestamp: new Date().toISOString(),
    instructions: [
        '1. Open the Admin Dashboard',
        '2. Select the semester: ' + SEMESTER_ID,
        '3. Click "Upload Timetable PDF" button',
        '4. Select this PDF file: ' + path.basename(DEFAULT_PDF_PATH),
        '5. Click "Upload" - the system will automatically parse and create lectures'
    ]
};

// Save metadata to a temp file for reference
const metadataPath = path.join(__dirname, 'pdf_metadata.json');
fs.writeFileSync(metadataPath, JSON.stringify({
    filename: pdfData.filename,
    path: DEFAULT_PDF_PATH,
    semesterId: pdfData.semesterId,
    fileSize: pdfData.fileSize,
    timestamp: pdfData.timestamp,
    instructions: pdfData.instructions
}, null, 2));

console.log('📝 PDF Metadata saved to: pdf_metadata.json\n');

console.log('=' .repeat(60));
console.log('NEXT STEPS:');
console.log('=' .repeat(60));
console.log(`
1. Ensure you have created a semester with ID: "${SEMESTER_ID}"
   (If not, create it in the Admin Dashboard first)

2. Open the Admin Dashboard: http://localhost:8000/pages/admin.html

3. Select the semester: "${SEMESTER_ID}"

4. Click the "Upload Timetable PDF" button

5. Select the file: ${path.basename(DEFAULT_PDF_PATH)}

6. The system will automatically:
   ✓ Parse the PDF
   ✓ Extract lecture information
   ✓ Create lecture entries in Firestore
   ✓ Show progress in real-time

The PDF parsing is handled by Firebase Cloud Functions and runs automatically
when you upload the file. Processing typically takes 30-60 seconds.

` );

console.log('💡 TIP: You can also drag-and-drop the PDF directly into the upload area!');
console.log('\n');
