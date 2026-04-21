const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

(async () => {
    console.log('Testing Gemini API Connection...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    try {
        const result = await model.generateContent('Say "READY" if you can hear me.');
        console.log('Response:', result.response.text());
    } catch (e) {
        console.error('API Error:', e.message);
    }
})();
