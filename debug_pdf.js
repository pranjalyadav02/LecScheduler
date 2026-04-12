const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Keys of pdf:', Object.keys(pdf));
if (typeof pdf !== 'function') {
    console.log('pdf is not a function. Checking for property "default"...');
    if (pdf.default && typeof pdf.default === 'function') {
        console.log('Found pdf.default as a function.');
    } else {
        console.log('pdf.default is not a function or missing.');
    }
}
