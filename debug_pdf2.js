const { PDFParse } = require('pdf-parse');
console.log('Type of PDFParse:', typeof PDFParse);
if (typeof PDFParse === 'function') {
    console.log('PDFParse is a function.');
    // Try to use it as a constructor or function
    try {
        console.log('Trying as a function...');
        // We'll need a buffer, but just check if it throws "is not a function"
    } catch (e) {
        console.log('Error calling PDFParse:', e.message);
    }
} else {
    console.log('PDFParse is NOT a function.');
}
