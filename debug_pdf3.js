const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function test() {
    console.log('Reading test.pdf...');
    const dataBuffer = fs.readFileSync('test.pdf');
    try {
        console.log('Instantiating PDFParse...');
        const parser = new PDFParse(dataBuffer);
        console.log('Methods of parser:', Object.keys(Object.getPrototypeOf(parser)));

        // If it's like the old one, it might have a .parse() method or something
        // But wait, the website says it's a "Pure TypeScript, cross-platform module for extracting text, images, and tabular data from PDFs"

        // Let's try t              qw cwww2c22c                  ccc 22222222222222222222222222222222222222222222222222222222233333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333332cc3233c33333333333333333333333333333333333c3 c cc         3333333c cxx1xxqqxx1xzo find the parse method
        if (typeof parser.parse === 'function') {
            console.log('Calling parser.parse()...');
            const result = await parser.parse();
            console.log('Result keys:', Object.keys(result));
            console.log('Text length:', result.text?.length);
        } else {
            console.log('No .parse() method found.');
        }
    } catch (e) {
        console.log('Error:', e.message);
        console.log(e.stack);
    }
}

test();
