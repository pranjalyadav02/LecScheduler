const fs = require('fs');
const pdf = require('pdf-parse');
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testPdf() {
    console.log("Reading test.pdf...");
    const dataBuffer = fs.readFileSync('test.pdf');
    let data;
    try {
        data = await pdf(dataBuffer);
    } catch (parserError) {
        if (parserError.message.includes("cannot be invoked without 'new'") ||
            parserError.message.includes("Class constructor")) {
            const instance = new pdf(dataBuffer);
            data = (typeof instance.parse === 'function') ? await instance.parse() : instance;
        } else {
            throw parserError;
        }
    }
    const text = data.text;
    console.log("PDF parsed length:", text.length);
    if (!text.trim()) {
        console.error("PDF text is empty!");
        return;
    }

    let cleanedText = text
        .replace(/\s+/g, ' ')           // Collapse multiple spaces/newlines
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
        .substring(0, 50000);           // Truncate to 50k chars

    console.log("Cleaned text:", cleanedText.substring(0, 500) + "...");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`[Gemini] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
Extract ALL lectures from the university timetable text below.
Return ONLY a valid JSON array of lecture objects – no markdown, no explanation.
Each object MUST have these exact keys:
- day        : String, uppercase 3-letter code: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"
- startTime  : String in 24-h "HH:MM" format, e.g. "11:00"
- endTime    : String in 24-h "HH:MM" format, e.g. "13:00"
- subjectCode: String, e.g. "IC-202C"
- subjectName: String, e.g. "Internet & Web Programming"
- faculty    : String, e.g. "Ms. Ragini Modi"
- room       : String, e.g. "LAB-1" or room number
- type       : "Lecture" or "Lab"
- semester   : String, e.g. "MCA SEMESTER II"
- section    : String, e.g. "A"

TIMETABLE TEXT:
${cleanedText}
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const jsonStr = response.text();

            let parsed;
            try {
                parsed = JSON.parse(jsonStr);
            } catch (err) {
                const stripped = jsonStr.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
                parsed = JSON.parse(stripped);
            }

            const lectures = Array.isArray(parsed) ? parsed : (parsed.lectures || []);
            console.log(`Model ${modelName} returned ${lectures.length} lectures.`);
            if (lectures.length > 0) {
                console.log("First lecture:", lectures[0]);
                break;
            }
        } catch (e) {
            console.error(`Error with ${modelName}:`, e.message);
        }
    }
}

testPdf().catch(e => require('fs').writeFileSync('error.txt', e.stack));
