const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\omen\\Downloads\\World Class Lecscheduler Minor Project Report.pdf';

if (fs.existsSync(pdfPath)) {
    const dataBuffer = fs.readFileSync(pdfPath);
    pdf(dataBuffer).then(function(data) {
        console.log(data.text);
    }).catch(function(error){
        console.error("Error parsing PDF:", error);
    });
} else {
    console.error("File not found:", pdfPath);
}
