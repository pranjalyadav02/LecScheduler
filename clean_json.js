const fs = require('fs');
const content = fs.readFileSync('mca_timetable.json', 'utf8');

// Find the first [ or { and the last ] or }
const start = content.indexOf('[');
const end = content.lastIndexOf(']');

if (start !== -1 && end !== -1) {
    const jsonStr = content.substring(start, end + 1);
    try {
        const data = JSON.parse(jsonStr);
        fs.writeFileSync('clean_timetable.json', JSON.stringify(data, null, 2));
        console.log(`✅ Extracted ${data.length} lectures to clean_timetable.json`);
    } catch (e) {
        console.error('❌ Failed to parse extracted JSON:', e.message);
    }
} else {
    console.error('❌ Could not find JSON array in file.');
}
