// Disable built-in body parser to handle multipart/form-data
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async (req, res) => {
    // DOMMatrix polyfill for Node.js environments (required by pdf-parse v2+)
    if (typeof global.DOMMatrix === 'undefined') {
        global.DOMMatrix = class DOMMatrix {
            constructor() {
                this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
            }
        };
    }

    try {
        // Delayed requires to catch loading errors
        let admin, Busboy, pdfParse, saveToGoogleSheets;
        try {
            admin = require('./lib/firebase-admin');
            Busboy = require('busboy');
            pdfParse = require('pdf-parse');
            saveToGoogleSheets = require('./lib/saveToGoogleSheets');
        } catch (loadError) {
            console.error('Dependency Load Error:', loadError.message);
            return res.status(500).json({
                error: 'Server Initialization Error: ' + loadError.message,
                hint: 'Ensure all dependencies are listed in package.json'
            });
        }

        console.log('API Request: processTimetable', { method: req.method });

        // CORS
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
            return res.status(400).json({ error: 'Expected multipart/form-data' });
        }

        return new Promise((resolve, reject) => {
            console.log('Initializing Busboy...');
            let busboy;
            try {
                busboy = Busboy({ headers: req.headers });
            } catch (bError) {
                console.error('Busboy Init Error:', bError.message);
                res.status(500).json({ error: 'Form Parser Error: ' + bError.message });
                return resolve();
            }

            let fileBuffer = null;
            let semesterId = null;

            busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
                console.log(`Receiving file: ${fieldname} (${filename})`);
                if (fieldname === 'pdf') {
                    const chunks = [];
                    file.on('data', (data) => chunks.push(data));
                    file.on('end', () => {
                        fileBuffer = Buffer.concat(chunks);
                        console.log('PDF received: ', fileBuffer.length, 'bytes');
                    });
                } else {
                    file.resume();
                }
            });

            busboy.on('field', (fieldname, val) => {
                if (fieldname === 'semesterId') {
                    semesterId = val;
                    console.log('Semester ID received:', semesterId);
                }
            });

            busboy.on('finish', async () => {
                console.log('Busboy finished parsing form.');
                if (!fileBuffer || !semesterId) {
                    res.status(400).json({ error: 'Missing file or semesterId' });
                    return resolve();
                }

                try {
                    const db = admin.firestore();

                    // Extract text
                    console.log('Parsing PDF content...');
                    // Handle cases where pdf-parse is exported as an object with .default
                    const parser = typeof pdfParse === 'function' ? pdfParse : (pdfParse.PDFParse || pdfParse.default);

                    if (typeof parser !== 'function') {
                        throw new Error(`pdf-parse is not a function (it is a ${typeof parser}). Export keys: ${Object.keys(pdfParse).join(', ')}`);
                    }

                    let pdfData;
                    try {
                        // Standard function call (pdf-parse v1)
                        pdfData = await parser(fileBuffer);
                    } catch (parserError) {
                        // Use 'new' if it's a Class constructor (pdf-parse v2)
                        if (parserError.message.includes("cannot be invoked without 'new'") ||
                            parserError.message.includes("Class constructor")) {
                            console.log('Using "new" keyword for Class-based PDFParse...');
                            const instance = new parser(fileBuffer);
                            // Some versions return data in constructor/promise, others have .parse()
                            pdfData = (typeof instance.parse === 'function') ? await instance.parse() : instance;
                        } else {
                            throw parserError;
                        }
                    }

                    let text = pdfData.text || pdfData;
                    // Ensure text is dynamic string
                    if (typeof text !== 'string') {
                        console.log('PDF extraction returned object, attempting to extract text property...');
                        text = text.text || JSON.stringify(text);
                    }

                    console.log('Text extracted, length:', text.length);

                    if (!text || text.trim().length === 0) {
                        res.status(400).json({ error: 'PDF appears empty or unreadable.' });
                        return resolve();
                    }

                    let lectures = [];
                    let parseMethod = 'none';
                    let parseError = null;

                    // Check for Gemini API Key to use LLM parsing
                    if (process.env.GEMINI_API_KEY) {
                        try {
                            console.log('Attempting to parse with Gemini LLM...');
                            parseMethod = 'gemini';
                            lectures = await parseTimetableWithGemini(text);
                            console.log('Gemini parsing successful, lectures:', lectures.length);
                        } catch (llmError) {
                            console.error('Gemini parsing failed:', llmError.message);
                            parseError = llmError.message;
                            parseMethod = 'regex-fallback';
                            lectures = parseTimetableText(text);
                        }
                    } else {
                        console.log('No GEMINI_API_KEY found, using regex parser.');
                        parseMethod = 'regex-only';
                        lectures = parseTimetableText(text);
                    }

                    if (lectures.length === 0) {
                        res.status(400).json({
                            error: 'No lectures could be parsed from this PDF format.',
                            diagnostics: {
                                parseMethod,
                                parseError,
                                hasGeminiKey: !!process.env.GEMINI_API_KEY,
                                textLength: text.length,
                                textSnippet: text.substring(0, 500)
                            }
                        });
                        return resolve();
                    }

                    console.log('Checking for clashes...');
                    const clashes = await detectClashes(db, lectures, semesterId);

                    if (clashes.length > 0) {
                        console.log('Clashes detected:', clashes.length);
                        res.status(400).json({ success: false, message: 'Clashes detected', clashes });
                        return resolve();
                    }

                    console.log('Saving lectures to Firestore...');
                    const batch = db.batch();
                    lectures.forEach(lecture => {
                        const docRef = db.collection('semesters').doc(semesterId).collection('lectures').doc();
                        batch.set(docRef, {
                            ...lecture,
                            semesterId,
                            status: 'scheduled',
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    });

                    await batch.commit();
                    console.log('Lectures batch saved successfully.');

                    let sheetUrl = null;
                    try {
                        console.log('Attempting to create Google Sheet...');
                        sheetUrl = await saveToGoogleSheets(lectures, semesterId);
                        if (sheetUrl) {
                            await db.collection('semesters').doc(semesterId).update({
                                timetableSheetUrl: sheetUrl,
                                lastTimetableUpdate: admin.firestore.FieldValue.serverTimestamp(),
                                lectureCount: lectures.length
                            });
                            console.log('Google Sheet created and linked.');
                        }
                    } catch (sheetError) {
                        console.error('Google Sheets Integration Failed (non-fatal):', sheetError.message);
                    }

                    res.status(200).json({
                        success: true,
                        message: `Created ${lectures.length} lectures successfully.`,
                        lecturesCreated: lectures.length,
                        sheetUrl: sheetUrl || null
                    });
                    resolve();

                } catch (error) {
                    console.error('Business Logic Error:', error);
                    res.status(500).json({ error: 'Processing Error: ' + error.message });
                    resolve();
                }
            });

            busboy.on('error', (err) => {
                console.error('Busboy Stream Error:', err);
                res.status(500).json({ error: 'Stream Error: ' + err.message });
                resolve();
            });

            req.pipe(busboy);
        });
    } catch (globalError) {
        console.error('CRITICAL API ERROR:', globalError);
        return res.status(500).json({ error: 'Server Exception: ' + globalError.message });
    }
};

/**
 * Advanced parser for structured timetable PDFs
 * Supports format: Header (Semester/Section/Room) + Schedule Table + Keys Table
 */
function parseTimetableText(text) {
    const lectures = [];

    try {
        // Split by sections (each section starts with "MCA SEMESTER")
        const sections = extractSections(text);

        for (const section of sections) {
            // Extract metadata
            const metadata = parseHeader(section);
            if (!metadata) continue;

            // Extract schedule and keys
            const schedule = parseScheduleTable(section);
            const keys = parseKeysTable(section);

            // Convert to individual lectures
            const sectionLectures = expandScheduleToLectures(schedule, keys, metadata);
            lectures.push(...sectionLectures);
        }

    } catch (error) {
        console.error('Parse error:', error);
        // Fallback to legacy parser if new parser fails
        return parseTimetableTextLegacy(text);
    }

    return lectures;
}

/**
 * Extract individual sections from PDF text
 */
function extractSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = [];

    for (const line of lines) {
        // Section boundary: starts with "MCA SEMESTER"
        if (line.includes('MCA SEMESTER')) {
            if (currentSection.length > 0) {
                sections.push(currentSection.join('\n'));
            }
            currentSection = [line];
        } else {
            currentSection.push(line);
        }
    }

    // Push last section
    if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
    }

    return sections;
}

/**
 * Parse header: Semester, Section, Room
 */
function parseHeader(sectionText) {
    const lines = sectionText.split('\n');

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];

        // Match: "MCA SEMESTER II (SECTION A)"
        const semesterMatch = line.match(/MCA SEMESTER ([IVX]+)\s*\(SECTION\s+([A-Z])\)/i);
        if (semesterMatch) {
            const semester = `MCA SEMESTER ${semesterMatch[1].trim()}`;
            const section = semesterMatch[2].trim();

            // Look for room in next few lines
            let room = 'TBD';
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const roomMatch = lines[j].match(/ROOM\s*[:-]?\s*(\d+)/i);
                if (roomMatch) {
                    room = roomMatch[1];
                    break;
                }
            }

            return { semester, section, room };
        }
    }

    return null;
}

/**
 * Parse schedule table (days × time slots)
 * Returns: [{ days: ["MON", "TUE"], slots: [{ time: "11:00-1:00", code: "IC-202C", shortName: "IWP" }] }]
 */
function parseScheduleTable(sectionText) {
    const lines = sectionText.split('\n');
    const schedule = [];

    // Find time slot headers (e.g., "11:00-1:00" or "1:00-2:00")
    let timeSlots = [];
    let scheduleStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect time slot row (contains multiple time ranges)
        const timeMatches = line.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/g);
        if (timeMatches && timeMatches.length >= 3) {
            timeSlots = timeMatches.map(t => t.replace(/\s+/g, ''));
            scheduleStartIndex = i + 1;
            break;
        }
    }

    if (timeSlots.length === 0) return [];

    // Parse day rows (MON-TUE, WED-THUR, FRI-SAT)
    for (let i = scheduleStartIndex; i < lines.length; i++) {
        const line = lines[i];

        // Stop at KEYS section
        if (line.includes('KEYS') || line.includes('SUB.CODE')) break;

        // Match day patterns
        const dayMatch = line.match(/(MON|TUE|WED|THU|FRI|SAT)/gi);
        if (!dayMatch || dayMatch.length === 0) continue;

        const days = Array.from(new Set(dayMatch.map(d => d.toUpperCase().slice(0, 3))));

        // Extract subject codes and names from this row
        // Pattern: "IC-202C\nIWP" or "IC-202C IWP"
        const slots = [];
        const codeMatches = line.match(/IC-\d{3}[A-Z]/g);

        if (codeMatches) {
            // Try to match codes with their short names
            const parts = line.split(/IC-\d{3}[A-Z]/).filter(p => p.trim());

            for (let j = 0; j < codeMatches.length && j < timeSlots.length; j++) {
                const code = codeMatches[j];
                // Extract short name (often appears after code)
                const shortName = parts[j] ? parts[j].trim().split(/\s+/)[0] : code;

                const [startTime, endTime] = timeSlots[j].split('-');
                slots.push({
                    startTime: startTime.trim(),
                    endTime: endTime.trim(),
                    subjectCode: code,
                    subjectShortName: shortName
                });
            }
        }

        if (days.length > 0 && slots.length > 0) {
            schedule.push({ days, slots });
        }
    }

    return schedule;
}

/**
 * Parse keys table (Subject Code → Subject Name → Faculty)
 */
function parseKeysTable(sectionText) {
    const lines = sectionText.split('\n');
    const keys = {};
    let inKeysSection = false;

    for (const line of lines) {
        // Start of keys section
        if (line.includes('KEYS') || line.includes('SUB.CODE')) {
            inKeysSection = true;
            continue;
        }

        // End of keys section (next section or footer)
        if (inKeysSection && (line.includes('Program') || line.includes('Director'))) {
            break;
        }

        if (inKeysSection) {
            // Match: "IC-202C Internet & Web programming Ms. Ragini Modi"
            const match = line.match(/(IC-\d{3}[A-Z])\s+(.+?)\s+(Ms\.|Mr\.|Dr\.)?\s*([A-Za-z\s.]+)$/);
            if (match) {
                const code = match[1];
                const subject = match[2].trim();
                const faculty = (match[3] || '') + ' ' + (match[4] || '').trim();

                keys[code] = {
                    fullName: subject,
                    faculty: faculty.trim()
                };
            }
        }
    }

    return keys;
}

/**
 * Expand schedule to individual lecture documents
 */
function expandScheduleToLectures(schedule, keys, metadata) {
    const lectures = [];

    for (const dayGroup of schedule) {
        for (const day of dayGroup.days) {
            for (const slot of dayGroup.slots) {
                const keyInfo = keys[slot.subjectCode] || {
                    fullName: slot.subjectShortName,
                    faculty: 'TBD'
                };

                lectures.push({
                    subject: keyInfo.fullName,
                    subjectCode: slot.subjectCode,
                    faculty: keyInfo.faculty,
                    day: day,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    room: metadata.room,
                    semester: metadata.semester,
                    section: metadata.section,
                });
            }
        }
    }

    return lectures;
}

/**
 * Legacy parser (fallback for pipe-delimited format)
 */
function parseTimetableTextLegacy(text) {
    const lectures = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.trim().length === 0) continue;

        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 6) continue;

        lectures.push({
            subject: parts[0],
            faculty: parts[1],
            day: parts[2],
            startTime: parts[3],
            endTime: parts[4],
            room: parts[5],
        });
    }
    return lectures;
}

async function detectClashes(db, newLectures, semesterId) {
    const clashes = [];
    const existingSnap = await db.collection('semesters').doc(semesterId).collection('lectures').get();

    // Simple O(N^2) check for demo purposes
    // In production, use a more efficient map
    const existing = existingSnap.docs.map(d => d.data());

    for (const newer of newLectures) {
        for (const older of existing) {
            if (newer.faculty === older.faculty && newer.day === older.day) {
                if (timesOverlap(newer.startTime, newer.endTime, older.startTime, older.endTime)) {
                    clashes.push({
                        faculty: newer.faculty,
                        day: newer.day,
                        newSubject: newer.subject,
                        existingSubject: older.subject
                    });
                }
            }
        }
    }
    return clashes;
}

function timesOverlap(start1, end1, start2, end2) {
    const toMin = t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    return toMin(start1) < toMin(end2) && toMin(start2) < toMin(end1);
}

/**
 * Uses Google Gemini LLM to parse messy PDF text into structured JSON lectures.
 */
async function parseTimetableWithGemini(text) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');

    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not set. Add it to Vercel project settings.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Clean and normalise the text before sending to the LLM.
    // High whitespace / non-printable chars waste tokens and confuse the model.
    let cleanedText = text
        .replace(/\s+/g, ' ')            // Collapse multiple spaces / newlines
        .replace(/[^\x20-\x7E\n]/g, '') // Strip non-printable characters
        .substring(0, 50000);            // Hard limit – any timetable fits in 50 k chars

    console.log(`[Gemini] Text ready: original=${text.length} chars, cleaned=${cleanedText.length} chars`);

    // ── Model priority list ────────────────────────────────────────────────────
    // The preferred model is gemini-2.5-flash (confirmed available via ListModels).
    // If you switch Google Cloud projects or API keys, run test_parser_simple.js first
    // to discover which models are available, then update this list accordingly.
    // Each entry is tried in order; the first one that returns data is used.
    const modelsToTry = [
        "gemini-2.5-flash",          // ← PRIMARY (confirmed working via test_parser_simple)
        "gemini-2.0-flash",          // fallback – may have quota limits on free tier
        "gemini-1.5-flash",          // legacy alias, may be 404 on some projects
    ];
    let lastError;

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
            } catch (parseErr) {
                // Strip ```json ... ``` fences the model may have added
                const stripped = jsonStr.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
                parsed = JSON.parse(stripped);
            }

            const lectures = Array.isArray(parsed) ? parsed : (parsed.lectures || []);
            if (lectures.length > 0) {
                console.log(`[Gemini] SUCCESS – model ${modelName} extracted ${lectures.length} lectures`);
                return lectures;
            }

            console.warn(`[Gemini] Model ${modelName} returned 0 lectures – trying next model...`);
        } catch (e) {
            // 404 → model not found for this project/region; 429 → quota exceeded
            const hint = e.status === 404
                ? 'Model not available for this project – run test_parser_simple.js to see available models'
                : e.status === 429
                    ? 'Quota exceeded – wait a minute or upgrade the API plan'
                    : '';
            console.error(`[Gemini] Model ${modelName} failed (${e.status || 'ERR'}): ${e.message}${hint ? ' | ' + hint : ''}`);
            lastError = e;
        }
    }

    throw lastError || new Error('[Gemini] All models failed – check logs above for details');
}
