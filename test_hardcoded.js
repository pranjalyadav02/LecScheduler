const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

(async () => {
    console.log('Testing Gemini with tiny hardcoded timetable...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    const prompt = `
    Extract lecture:
    MON 11:00-1:00 IC-202C IWP Ms. Ragini Modi ROOM-201
    Return JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        console.log('Response:', result.response.text());
    } catch (e) {
        console.error('API Error:', e.message);
    }
})();
