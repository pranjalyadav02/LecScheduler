/**
 * STUDENT ADMISSION SYNC - Guiding Command
 * 
 * Usage: node sync_students.js --csv data.csv
 * Format: Timestamp, Full Name, Enrollment Number, Phone Number, Semester, Section
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ID = 'lecscheduler-4e36b';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Main execution
 */
async function syncFromCsv(csvPath) {
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV File not found: ${csvPath}`);
        return;
    }

    const data = fs.readFileSync(csvPath, 'utf8');
    const rows = data.split('\n').slice(1); // Skip header

    console.log(`🚀 Starting Sync: Processing ${rows.length} students...`);

    for (let row of rows) {
        if (!row.trim()) continue;
        
        const [timestamp, name, enrollmentNo, phone, semesterName, section] = row.split(',').map(s => s.trim());
        
        // Map "II" -> "mca_semester_ii"
        const semesterId = `mca_semester_${semesterName.toLowerCase()}`;
        
        const studentData = {
            enrollmentNo,
            name,
            phone,
            semesterId,
            section,
            status: 'active',
            authCreated: false,
            createdAt: { timestampValue: new Date().toISOString() }
        };

        const docPath = `semesters/${semesterId}/students/${enrollmentNo}`;
        
        try {
            await firestoreSet(docPath, studentData);
            console.log(`   ✅ Synced: ${enrollmentNo} (${name}) -> ${semesterId} Sec ${section}`);
        } catch (e) {
            console.error(`   ❌ Failed: ${enrollmentNo}: ${e.message}`);
        }
    }
    
    console.log('\n✅ SYNC COMPLETE! Students added to Firestore.');
    console.log(`💡 Next Step: Run 'batchCreateStudents.js' to generate login credentials.`);
}

/**
 * Firestore Helper
 */
async function firestoreSet(docPath, data) {
    const fields = toFirestoreFields(data);
    const url = `${BASE_URL}/${docPath}`;
    
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Firestore API Error');
    }
}

function toFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') fields[key] = { stringValue: value };
        else if (typeof value === 'number') fields[key] = { integerValue: value.toString() };
        else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
        else if (value && value.timestampValue) fields[key] = value;
    }
    return fields;
}

// Extract path from args
const args = process.argv.slice(2);
const csvFileArg = args.indexOf('--csv');
if (csvFileArg !== -1 && args[csvFileArg + 1]) {
    syncFromCsv(args[csvFileArg + 1]);
} else {
    console.log('Usage: node sync_students.js --csv <filename.csv>');
}
