const pdfModule = require('pdf-parse');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Import parsing functions from processTimetable
function parseTimetableText(text) {
    const lectures = [];

    try {
        const sections = extractSections(text);
        console.log(`\n✓ Found ${sections.length} sections\n`);

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            console.log(`--- Processing Section ${i + 1} ---`);

            const metadata = parseHeader(section);
            if (!metadata) {
                console.log('⚠ No header found, skipping');
                continue;
            }
            console.log(`Semester: ${metadata.semester}, Section: ${metadata.section}, Room: ${metadata.room}`);

            const schedule = parseScheduleTable(section);
            console.log(`Schedule entries: ${schedule.length}`);

            const keys = parseKeysTable(section);
            console.log(`Keys found: ${Object.keys(keys).length}`);
            console.log('Keys:', JSON.stringify(keys, null, 2));

            const sectionLectures = expandScheduleToLectures(schedule, keys, metadata);
            console.log(`Lectures created: ${sectionLectures.length}\n`);

            lectures.push(...sectionLectures);
        }

    } catch (error) {
        console.error('Parse error:', error);
    }

    return lectures;
}

function extractSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = [];

    for (const line of lines) {
        if (line.includes('MCA SEMESTER')) {
            if (currentSection.length > 0) {
                sections.push(currentSection.join('\n'));
            }
            currentSection = [line];
        } else {
            currentSection.push(line);
        }
    }

    if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
    }

    return sections;
}

function parseHeader(sectionText) {
    const lines = sectionText.split('\n');
    console.log('  --- Header Search ---');

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        console.log(`  Line ${i}: "${line}"`);
        // More flexible regex to handle space anomalies like (SECTION A) or (SECTION  A)
        const semesterMatch = line.match(/MCA SEMESTER\s+([IVX]+)\s*\(SECTION\s*[^A-Z]*([A-Z])\)/i);
        if (semesterMatch) {
            const semester = `MCA SEMESTER ${semesterMatch[1].trim()}`;
            const section = semesterMatch[2].trim();

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

function parseScheduleTable(sectionText) {
    const lines = sectionText.split('\n');
    const schedule = [];

    let timeSlots = [];
    let scheduleStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const timeMatches = line.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/g);
        if (timeMatches && timeMatches.length >= 3) {
            timeSlots = timeMatches.map(t => t.replace(/\s+/g, ''));
            scheduleStartIndex = i + 1;
            console.log('  Time slots:', timeSlots);
            break;
        }
    }

    if (timeSlots.length === 0) return [];

    for (let i = scheduleStartIndex; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('KEYS') || line.includes('SUB.CODE')) break;

        const dayMatch = line.match(/(MON|TUE|WED|THU|FRI|SAT)/gi);
        if (!dayMatch || dayMatch.length === 0) continue;

        const days = Array.from(new Set(dayMatch.map(d => d.toUpperCase().slice(0, 3))));

        const slots = [];
        const codeMatches = line.match(/IC-\d{3}[A-Z]/g);

        if (codeMatches) {
            const parts = line.split(/IC-\d{3}[A-Z]/).filter(p => p.trim());

            for (let j = 0; j < codeMatches.length && j < timeSlots.length; j++) {
                const code = codeMatches[j];
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
            console.log(`  Day group: ${days.join(', ')} - ${slots.length} slots`);
            schedule.push({ days, slots });
        }
    }

    return schedule;
}

function parseKeysTable(sectionText) {
    const lines = sectionText.split('\n');
    const keys = {};
    let inKeysSection = false;

    for (const line of lines) {
        if (line.includes('KEYS') || line.includes('SUB.CODE')) {
            inKeysSection = true;
            continue;
        }

        if (inKeysSection && (line.includes('Program') || line.includes('Director'))) {
            break;
        }

        if (inKeysSection) {
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

// Test with actual extracted text
const textPath = 'C:\\Users\\omen\\LecScheduler\\pdf_text.txt';
const text = fs.readFileSync(textPath, 'utf8');

(async () => {
    console.log('================================================================================');
    console.log('TESTING TIMETABLE PARSER');
    console.log('================================================================================\n');

    try {
        const lectures = await parseTimetableWithGemini(text);

        console.log('================================================================================');
        console.log(`✓ TOTAL LECTURES EXTRACTED: ${lectures.length}`);
        console.log('================================================================================\n');

        if (lectures.length > 0) {
            console.log('Sample lecture (first entry):');
            console.log(JSON.stringify(lectures[0], null, 2));
        }

        // Group by section
        const bySection = {};
        lectures.forEach(lec => {
            const key = `${lec.room || 'Unknown Room'} - ${lec.subjectCode}`;
            if (!bySection[key]) bySection[key] = 0;
            bySection[key]++;
        });

        console.log('\nLectures by Code/Room:');
        Object.entries(bySection).forEach(([key, count]) => {
            console.log(`  ${key}: ${count} lectures`);
        });
    } catch (err) {
        console.error("Error running parser:", err);
    }

    async function parseTimetableWithGemini(text) {
        // Only works if GEMINI_API_KEY is in process.env, let's check
        if (!process.env.GEMINI_API_KEY) {
            console.error("NO GEMINI API KEY PROVIDED IN ENV. CANNOT TEST.");
            return [];
        }

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        let cleanedText = text
            .replace(/\s+/g, ' ')           // Collapse multiple spaces/newlines
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .substring(0, 50000);           // Truncate to 50k chars (plenty for any timetable)

        console.log(`[Gemini] Text ready: original=${text.length} chars, cleaned=${cleanedText.length} chars`);

        // ── Model priority list ──────────────────────────────────────────────────
        // Run test_parser_simple.js to discover which models are available for your
        // API key / Google Cloud project, then keep this list in sync.
        const modelsToTry = [
            "gemini-2.5-flash",          // ← PRIMARY (confirmed working via test_parser_simple)
            "gemini-2.0-flash",          // fallback – may hit free-tier quota
            "gemini-1.5-flash",          // legacy alias, may be 404 on some projects
        ];
        let lastError;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting parse with model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `
            Extract all lectures from the following university timetable text. 
            Return a JSON array of lecture objects. 
            Each object MUST have:
            - day: (String, uppercase: "MON", "TUE", "WED", "THU", "FRI", "SAT")
            - startTime: (String, "HH:MM", e.g., "11:00")
            - endTime: (String, "HH:MM", e.g., "13:00")
            - subjectCode: (String, e.g., "IC-202C")
            - subjectName: (String, e.g., "Internet & Web Programming")
            - faculty: (String, e.g., "Pranjal Yadav")
            - room: (String, e.g., "LAB-1" or "ROOM-101")
            - type: (String, "Lecture" or "Lab")

            TIMETABLE TEXT:
            ${cleanedText}
            `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const jsonStr = response.text();

                const parsed = JSON.parse(jsonStr);
                const lectures = Array.isArray(parsed) ? parsed : (parsed.lectures || []);
                if (lectures.length > 0) return lectures;

                console.log(`Model ${modelName} returned 0 lectures, trying next...`);
            } catch (e) {
                console.error(`Model ${modelName} failed:`, e.message);
                lastError = e;
            }
        }

        throw lastError || new Error('All Gemini models failed to parse text');
    }
})();
