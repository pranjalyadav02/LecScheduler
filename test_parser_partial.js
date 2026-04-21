const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

(async () => {
    const textPath = 'pdf_text.txt';
    const rawText = fs.readFileSync(textPath, 'utf8');
    const text = rawText.substring(0, 1000); // Only first 1000 chars

    console.log(`[Gemini] Testing snippet (${text.length} chars)...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
    Extract lectures from this text into a raw JSON array of objects – NO markdown fences, NO explanation.
    Each object must have:
    - day: "MON" | "TUE" | ...
    - startTime: "HH:MM"
    - endTime: "HH:MM"
    - subjectCode: String
    - subjectName: String
    - faculty: String
    - room: String

    TEXT:
    ${text}
    `;

    try {
        const result = await model.generateContent(prompt);
        console.log('Parsed:', result.response.text());
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
