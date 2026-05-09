// ============================================================================
// ADMIN DASHBOARD JAVASCRIPT
// ============================================================================

let currentSemesterId = null;
const INSTITUTIONAL_PDF_NAME = 'Updated_MCA_TT_Jan_May_12012026 (1).pdf';
const INSTITUTIONAL_CSV_PATH = '../assets/sem2_sectionwise_timetable.csv';
const SEMESTER_ID_MAP = {
    SEM2: 'mca_semester_ii',
    SEM4: 'mca_semester_iv',
    SEM6: 'mca_semester_vi',
    SEM8: 'mca_semester_viii',
};
const SEMESTER_LABEL_MAP = {
    SEM2: 'II',
    SEM4: 'IV',
    SEM6: 'VI',
    SEM8: 'VIII',
};
// Firebase services are available as window.auth, window.db, window.storage, window.functions
// Initialized by firebase-config.js

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if user is authenticated and is admin
        window.auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = '/pages/login.html';
                return;
            }

            // Verify admin role
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                showError('Unauthorized. Admin access required.');
                setTimeout(() => logout(), 2000);
                return;
            }

            document.getElementById('adminName').textContent = user.displayName || 'Admin';
            
            // Initialize Firebase Cloud Messaging for push notifications
            if (typeof initializeMessaging === 'function') {
                initializeMessaging().catch(err => 
                    console.warn('Messaging initialization error:', err)
                );
            }
            
            loadSemesters();
        });
    } catch (error) {
        showError(error.message);
    }
});

// ============================================================================
// SEMESTER MANAGEMENT
// ============================================================================

async function loadSemesters() {
    try {
        const snapshot = await window.db.collection('semesters').get();
        const select = document.getElementById('semesterSelect');
        select.innerHTML = '<option value="">-- Choose Semester --</option>';

        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name || doc.id;
            select.appendChild(option);
        });
    } catch (error) {
        showError(`Failed to load semesters: ${error.message}`);
    }
}

function setSemesterDropdownOptions(semesters) {
    const select = document.getElementById('semesterSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Semester --</option>';
    semesters.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem.id;
        option.textContent = sem.name || sem.id;
        select.appendChild(option);
    });
}

async function loadSemesterData() {
    currentSemesterId = document.getElementById('semesterSelect').value;
    if (!currentSemesterId) {
        showStatus('uploadStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        loadTimetableSummary();
        loadFacultyList();
    } catch (error) {
        showError(error.message);
    }
}

// ============================================================================
// SYSTEM MASTER RESET
// ============================================================================

const MASTER_TIMETABLE_DATA = [
    {
        semesterId: 'mca_semester_ii',
        name: 'MCA Semester II (Jan-May 2026)',
        sections: [
            {
                name: 'A', room: '201',
                faculties: { 'IC-205C': 'Ms. Shraddha Soni', 'IC-202C': 'Ms. Ragini Modi', 'IC-204B': 'Dr. Rajesh Verma', 'IC-201': 'Mr. Hemant Prakash Gavde', 'IC-206D': 'Dr. Pushpendra Dubey', 'IC-209D': 'Mr. Dheeraj Upadhayay', 'IC-210E': 'Mr. Anshul Satle' },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '11:00-13:00', subject: 'C++ Lab', code: 'IC-209D' },
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'IWP', code: 'IC-202C' },
                    { days: ['Monday', 'Tuesday'], time: '14:00-15:00', subject: 'DCO', code: 'IC-204B' },
                    { days: ['Monday', 'Tuesday'], time: '15:00-16:00', subject: 'Hindi', code: 'IC-206D' },
                    { days: ['Monday', 'Tuesday'], time: '16:00-17:00', subject: 'Mathematics-II', code: 'IC-201' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-14:00', subject: 'Oops using C++', code: 'IC-205C' },
                    { days: ['Wednesday', 'Thursday'], time: '14:00-15:00', subject: 'Mathematics-II', code: 'IC-201' },
                    { days: ['Wednesday', 'Thursday'], time: '15:00-16:00', subject: 'Hindi', code: 'IC-206D' },
                    { days: ['Wednesday', 'Thursday'], time: '16:00-17:00', subject: 'IWP', code: 'IC-202C' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'Oops Using C++', code: 'IC-205C' },
                    { days: ['Friday', 'Saturday'], time: '14:00-15:00', subject: 'DCO', code: 'IC-204B' },
                    { days: ['Friday', 'Saturday'], time: '15:00-17:00', subject: 'IWP Lab', code: 'IC-210E' }
                ]
            },
            {
                name: 'B', room: '202',
                faculties: { 'IC-205C': 'Ms. Shraddha Soni', 'IC-202C': 'Ms. Kirti Vijayvergia', 'IC-204B': 'Mr Prakshep Goswami', 'IC-201': 'Mr. Hemant Prakash Gavde', 'IC-206D': 'Dr. Pushpendra Dubey', 'IC-209D': 'Mr. Dheeraj Upadhayay', 'IC-210E': 'Mr. Rajesh Verma' },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'IWP', code: 'IC-202C' },
                    { days: ['Monday', 'Tuesday'], time: '14:00-15:00', subject: 'Oops using C++', code: 'IC-205C' },
                    { days: ['Monday', 'Tuesday'], time: '15:00-16:00', subject: 'Mathematics-II', code: 'IC-201' },
                    { days: ['Monday', 'Tuesday'], time: '16:00-17:00', subject: 'Hindi', code: 'IC-206D' },
                    { days: ['Wednesday', 'Thursday'], time: '11:00-13:00', subject: 'C++ Lab', code: 'IC-209D' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-14:00', subject: 'Mathematics-II', code: 'IC-201' },
                    { days: ['Wednesday', 'Thursday'], time: '14:00-15:00', subject: 'DCO', code: 'IC-204B' },
                    { days: ['Wednesday', 'Thursday'], time: '15:00-16:00', subject: 'Hindi', code: 'IC-206D' },
                    { days: ['Friday', 'Saturday'], time: '11:00-13:00', subject: 'IWP Lab', code: 'IC-210E' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'DCO', code: 'IC-204B' },
                    { days: ['Friday', 'Saturday'], time: '14:00-15:00', subject: 'IWP', code: 'IC-202C' },
                    { days: ['Friday', 'Saturday'], time: '15:00-16:00', subject: 'Oops using C++', code: 'IC-205C' }
                ]
            }
        ]
    },
    {
        semesterId: 'mca_semester_iv',
        name: 'MCA Semester IV (Jan-May 2026)',
        sections: [
            {
                name: 'A', room: '203',
                faculties: { 'IC-403D': 'Dr. Nitin Nagar', 'IC-402A': 'Dr. Rupesh Sendre', 'IC-405A': 'Dr. Vivek Shrivastav', 'IC-401C': 'Mr. Rajesh Verma', 'IC-406D': 'Dr. Monalisa Khatre', 'IC-408C': 'Mr. Pratham Jaiswal', 'IC-411C': 'Mr Prakshep Goswami' },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '11:00-13:00', subject: 'Prog. with Java Lab', code: 'IC-408C' },
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'Unix OS', code: 'IC-405A' },
                    { days: ['Monday', 'Tuesday'], time: '14:00-15:00', subject: 'Discrete Maths', code: 'IC-402A' },
                    { days: ['Monday', 'Tuesday'], time: '15:00-16:00', subject: 'DCC', code: 'IC-401C' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-14:00', subject: 'Prog. With Java', code: 'IC-403D' },
                    { days: ['Wednesday', 'Thursday'], time: '14:00-15:00', subject: 'Unix OS', code: 'IC-405A' },
                    { days: ['Wednesday', 'Thursday'], time: '15:00-16:00', subject: 'DCC', code: 'IC-401C' },
                    { days: ['Wednesday', 'Thursday'], time: '16:00-17:00', subject: 'Eship', code: 'IC-406D' },
                    { days: ['Friday', 'Saturday'], time: '11:00-13:00', subject: 'Unix OS Lab', code: 'IC-411C' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'Discrete Maths', code: 'IC-402A' },
                    { days: ['Friday', 'Saturday'], time: '14:00-15:00', subject: 'Prog. With Java', code: 'IC-403D' },
                    { days: ['Friday', 'Saturday'], time: '15:00-16:00', subject: 'E.ship', code: 'IC-406D' }
                ]
            },
            {
                name: 'B', room: '204',
                faculties: { 'IC-403D': 'Mr. Pratham Jaiswal', 'IC-402A': 'Dr. Nitin Nagar', 'IC-405A': 'Dr. Vivek Shrivastava', 'IC-401C': 'Mr. Rajesh Verma', 'IC-406D': 'Dr. Monalisa Khatre', 'IC-408C': 'Mr. Pratham Jaiswal', 'IC-411C': 'Mr Prakshep Goswami' },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'Discrete Maths', code: 'IC-402A' },
                    { days: ['Monday', 'Tuesday'], time: '14:00-15:00', subject: 'Prog. With Java', code: 'IC-403D' },
                    { days: ['Monday', 'Tuesday'], time: '15:00-17:00', subject: 'Unix OS Lab', code: 'IC-411C' },
                    { days: ['Wednesday', 'Thursday'], time: '11:00-13:00', subject: 'Prog. with Java Lab', code: 'IC-408C' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-14:00', subject: 'Unix OS', code: 'IC-405A' },
                    { days: ['Wednesday', 'Thursday'], time: '14:00-15:00', subject: 'DCC', code: 'IC-401C' },
                    { days: ['Wednesday', 'Thursday'], time: '15:00-16:00', subject: 'Eship', code: 'IC-406D' },
                    { days: ['Wednesday', 'Thursday'], time: '16:00-17:00', subject: 'Prog. With Java', code: 'IC-403D' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'Discrete Maths', code: 'IC-402A' },
                    { days: ['Friday', 'Saturday'], time: '14:00-15:00', subject: 'Unix OS', code: 'IC-405A' },
                    { days: ['Friday', 'Saturday'], time: '15:00-16:00', subject: 'DCC', code: 'IC-401C' }
                ]
            }
        ]
    }
];

async function handleMasterReset() {
    if (!confirm('WARNING: This will wipe ALL current lectures and restore the master institutional timetable. Proceed?')) return;
    
    try {
        const statusEl = document.getElementById('resetStatus');
        showStatus('resetStatus', '🚀 Starting Master Reset...', 'info');

        let totalSems = 0;
        let totalLectures = 0;

        for (const semData of MASTER_TIMETABLE_DATA) {
            showStatus('resetStatus', `Processing ${semData.name}...`, 'info');
            
            // 1. Ensure semester document exists
            await window.db.collection('semesters').doc(semData.semesterId).set({
                name: semData.name,
                active: true,
                updatedAt: new Date()
            }, { merge: true });

            // 2. Wipe existing lectures
            const lecturesSnap = await window.db.collection('semesters').doc(semData.semesterId)
                .collection('lectures').get();
            
            if (!lecturesSnap.empty) {
                let batch = window.db.batch();
                let count = 0;
                for (const doc of lecturesSnap.docs) {
                    batch.delete(doc.ref);
                    count++;
                    if (count === 450) { await batch.commit(); batch = window.db.batch(); count = 0; }
                }
                if (count > 0) await batch.commit();
            }

            // 3. Create expanded lectures
            for (const section of semData.sections) {
                let batch = window.db.batch();
                let count = 0;
                
                for (const entry of section.schedule) {
                    const expanded = entryToLectures(entry, section, semData.semesterId);
                    
                    for (const lec of expanded) {
                        const lectureId = `${lec.day}_${lec.startTime}_${lec.section}_${lec.code || lec.subject}`
                            .toLowerCase().replace(/[^a-z0-9_]+/g, '_');
                        
                        const ref = window.db.collection('semesters').doc(semData.semesterId)
                            .collection('lectures').doc(lectureId);
                        
                        batch.set(ref, {
                            ...lec,
                            status: 'scheduled',
                            updatedAt: new Date()
                        });
                        count++;
                        totalLectures++;
                        
                        // Commit large batches
                        if (count === 400) {
                            await batch.commit();
                            batch = window.db.batch();
                            count = 0;
                        }
                    }
                }
                if (count > 0) await batch.commit();
            }
            totalSems++;
        }
        
        showStatus('resetStatus', `✅ Master Reset Complete! Seeded ${totalSems} semesters and ${totalLectures} lectures.`, 'success');
        if (typeof loadSemesters === 'function') loadSemesters();
    } catch (error) {
        console.error('Master Reset failed:', error);
        showStatus('resetStatus', `❌ Reset failed: ${error.message}`, 'error');
    }
}

/**
 * Expands a schedule entry (e.g. Mon-Tue) into individual daily lectures.
 */
function entryToLectures(entry, section, semesterId) {
    const lectures = [];
    const [start, end] = entry.time.split('-');
    
    // Normalize faculty ID: "Dr. Rajesh Verma" -> "rajesh_verma"
    const facultyName = section.faculties[entry.code] || 'TBD';
    const facultyId = facultyName.toLowerCase()
        .replace(/^(dr\.|mr\.|ms\.|mrs\.)\s*/i, '') // Remove prefixes
        .replace(/[\s.]+/g, '_') // Replace spaces and dots with underscores
        .replace(/[^a-z_]/g, '') // Remove non-alpha
        .replace(/^_+|_+$/g, ''); // Trim underscores

    for (const day of entry.days) {
        lectures.push({
            subject: entry.subject,
            code: entry.code || '',
            faculty: facultyName,
            facultyId: facultyId,
            day: day,
            startTime: start,
            endTime: end,
            room: section.room,
            section: section.name,
            semesterId: semesterId
        });
    }
    return lectures;
}

// ============================================================================
// PDF UPLOAD & TIMETABLE
// ============================================================================

async function handlePDFUpload(event) {
    event.preventDefault();

    if (!currentSemesterId) {
        showStatus('uploadStatus', 'Please select a semester first', 'warning');
        return;
    }

    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('uploadStatus', 'Please choose a file', 'error');
        return;
    }

    if (!file.type.includes('pdf')) {
        showStatus('uploadStatus', 'Please upload a valid PDF file', 'error');
        return;
    }

    try {
        showStatus('uploadStatus', 'Uploading to secure storage...', 'info');
        
        // Upload path: timetables/{semesterId}/{filename}
        const storageRef = window.storage.ref(`timetables/${currentSemesterId}/${file.name}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                showStatus('uploadStatus', `Uploading: ${progress.toFixed(0)}%`, 'info');
            }, 
            (error) => {
                showStatus('uploadStatus', `Upload error: ${error.message}`, 'error');
            }, 
            async () => {
                showStatus('uploadStatus', 'Processing PDF content... this may take a moment.', 'info');
                // The Cloud Function (processPDFTimetable) will trigger automatically on Storage Finalize
                checkUploadStatus();
            }
        );

    } catch (error) {
        showStatus('uploadStatus', `Upload failed: ${error.message}`, 'error');
    }
}

async function checkUploadStatus() {
    try {
        const snapshot = await window.db.collection('pdf_uploads')
            .where('semesterId', '==', currentSemesterId)
            .get();

        if (snapshot.empty) {
            return;
        }

        // Sort client-side by uploadedAt descending
        const uploads = snapshot.docs.map(doc => doc.data())
            .sort((a, b) => (b.uploadedAt?.toDate() || 0) - (a.uploadedAt?.toDate() || 0));

        const latestUpload = uploads[0];

        if (latestUpload.status === 'processing') {
            setTimeout(() => checkUploadStatus(), 3000);
            return;
        }

        if (latestUpload.status === 'success') {
            showStatus('uploadStatus', 
                `✓ Successfully created ${latestUpload.lecturesCreated} lectures.`, 
                'success');
        } else if (latestUpload.status === 'failed') {
            const errorMsg = latestUpload.clashesFound 
                ? 'Scheduling conflicts detected. Please resolve faculty time clashes.'
                : latestUpload.errorLog;
            showStatus('uploadStatus', `✗ ${errorMsg}`, 'error');
        }

        loadTimetableSummary();
    } catch (error) {
        showStatus('uploadStatus', `Error checking status: ${error.message}`, 'error');
    }
}

async function loadTimetableSummary() {
    try {
        const lectures = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('status', '!=', 'archived')
            .get();

        const counts = {
            total: lectures.size,
            scheduled: 0,
            cancelled: 0,
            rescheduled: 0,
        };

        const sectionCounts = {};
        lectures.forEach(doc => {
            const data = doc.data();
            const status = data.status;
            if (status === 'scheduled') counts.scheduled++;
            else if (status === 'cancelled') counts.cancelled++;
            else if (status === 'rescheduled') counts.rescheduled++;

            const sec = data.section || 'N/A';
            sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
        });

        let msg = `Total: ${counts.total} | Scheduled: ${counts.scheduled} | Cancelled: ${counts.cancelled} | Rescheduled: ${counts.rescheduled}`;
        const secDetails = Object.entries(sectionCounts).map(([sec, count]) => `Sec ${sec}: ${count}`).join(' | ');
        if (secDetails) msg += `\n\n📌 Section-wise: ${secDetails}`;
        
        showStatus('lectureStatus', msg, 'info');
    } catch (error) {
        showStatus('lectureStatus', `Error loading timetable: ${error.message}`, 'error');
    }
}

async function showTimetableModal() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const semesterName = document.getElementById('semesterSelect').options[document.getElementById('semesterSelect').selectedIndex].text;
        
        const snapshot = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .get();

        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        window.allLectures = snapshot.docs.map(doc => doc.data())
            .sort((a, b) => {
                const dayOrderA = dayOrder.indexOf(a.day);
                const dayOrderB = dayOrder.indexOf(b.day);
                if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
                return (a.startTime || '').localeCompare(b.startTime || '');
            });

        // Update modal title
        document.querySelector('#timetableModal h2').textContent = `Timetable: ${semesterName}`;

        // Populate section filter
        const sections = [...new Set(window.allLectures.map(l => l.section))].filter(Boolean).sort();
        const filter = document.getElementById('modalSecFilter');
        filter.innerHTML = '<option value="">All Sections</option>';
        sections.forEach(sec => {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = `Section ${sec}`;
            filter.appendChild(opt);
        });

        renderTimetable(window.allLectures);

        document.getElementById('timetableModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading timetable: ${error.message}`);
    }
}

function filterTimetableBySection() {
    const sec = document.getElementById('modalSecFilter').value;
    const filtered = sec 
        ? window.allLectures.filter(l => l.section === sec)
        : window.allLectures;
    renderTimetable(filtered);
}

function renderTimetable(lectures) {
    const listDiv = document.getElementById('timetableList');
    listDiv.innerHTML = '';

    if (lectures.length === 0) {
        listDiv.innerHTML = '<p>No lectures found.</p>';
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'data-table-wrapper';
    
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Day</th>
                <th>Time</th>
                <th>Room</th>
                <th>Section</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    lectures.forEach(lecture => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${lecture.code || '-'}</td>
            <td>${lecture.subject}</td>
            <td>${lecture.faculty}</td>
            <td>${lecture.day}</td>
            <td>${lecture.startTime} - ${lecture.endTime}</td>
            <td>${lecture.room}</td>
            <td>${lecture.section || '-'}</td>
            <td><span class="status-badge ${lecture.status}">${lecture.status}</span></td>
        `;
    });

    wrapper.appendChild(table);
    listDiv.appendChild(wrapper);
}

function closeTimetableModal() {
    document.getElementById('timetableModal').style.display = 'none';
}

async function seedInstitutionalTimetableFromCsv() {
    const response = await fetch(INSTITUTIONAL_CSV_PATH, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Could not load institutional data file (${response.status})`);
    }

    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('Institutional timetable CSV is empty');

    const header = lines[0].split(',').map(h => h.trim());
    const required = ['Semester', 'Section', 'Day', 'Start', 'End', 'Subject', 'Code', 'Faculty', 'Room'];
    const missing = required.filter(col => !header.includes(col));
    if (missing.length) {
        throw new Error(`CSV missing columns: ${missing.join(', ')}`);
    }

    const idx = {};
    header.forEach((name, i) => { idx[name] = i; });
    const seededSemesterIds = new Set();
    const seededSemestersById = new Map();
    const semesterCodeById = new Map();
    const writes = [];
    const lectureRowsBySemester = {};
    let lectureCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < header.length) continue;

        const semCode = (cols[idx.Semester] || '').toUpperCase();
        const semesterId = SEMESTER_ID_MAP[semCode];
        if (!semesterId) continue;

        const section = (cols[idx.Section] || 'A').toUpperCase();
        const day = cols[idx.Day] || 'Monday';
        const startTime = cols[idx.Start] || '09:00';
        const endTime = cols[idx.End] || '10:00';
        const subject = cols[idx.Subject] || 'Lecture';
        const code = cols[idx.Code] || '';
        const faculty = cols[idx.Faculty] || 'TBD';
        const room = cols[idx.Room] || 'TBD';

        seededSemesterIds.add(semesterId);
        seededSemestersById.set(semesterId, {
            id: semesterId,
            name: `MCA Semester ${SEMESTER_LABEL_MAP[semCode] || semCode.replace('SEM', '')}`,
        });
        semesterCodeById.set(semesterId, semCode);

        if (!lectureRowsBySemester[semesterId]) {
            lectureRowsBySemester[semesterId] = [];
        }
        lectureRowsBySemester[semesterId].push({
            day,
            startTime,
            endTime,
            subject,
            code,
            faculty,
            room,
            section,
        });

        lectureCount++;
    }

    // Reset existing lecture docs to prevent growing totals on repeated imports.
    for (const semesterId of seededSemesterIds) {
        const semesterRef = window.db.collection('semesters').doc(semesterId);
        writes.push(
            semesterRef.set({
                name: seededSemestersById.get(semesterId).name,
                code: semesterCodeById.get(semesterId) || '',
                active: true,
                updatedAt: new Date(),
            }, { merge: true })
        );
    }

    if (!writes.length) throw new Error('No valid lecture rows found in institutional CSV');
    await Promise.all(writes);

    // Clear existing lectures for each seeded semester (non-archived and archived alike).
    for (const semesterId of seededSemesterIds) {
        const semesterRef = window.db.collection('semesters').doc(semesterId);
        const snapshot = await semesterRef.collection('lectures').get();
        if (!snapshot.empty) {
            let batch = window.db.batch();
            let opCount = 0;
            for (const doc of snapshot.docs) {
                batch.delete(doc.ref);
                opCount++;
                if (opCount === 450) {
                    await batch.commit();
                    batch = window.db.batch();
                    opCount = 0;
                }
            }
            if (opCount > 0) {
                await batch.commit();
            }
        }
    }

    // Insert clean lecture set for each seeded semester.
    for (const semesterId of seededSemesterIds) {
        const semesterRef = window.db.collection('semesters').doc(semesterId);
        const rows = lectureRowsBySemester[semesterId] || [];
        const writeOps = rows.map(row => {
            const lectureId = `${row.day}_${row.startTime}_${row.section}_${row.code || row.subject}`
                .toLowerCase()
                .replace(/[^a-z0-9_]+/g, '_');
            return semesterRef.collection('lectures').doc(lectureId).set({
                subject: row.subject,
                code: row.code,
                faculty: row.faculty,
                day: row.day,
                startTime: row.startTime,
                endTime: row.endTime,
                room: row.room,
                section: row.section,
                status: 'scheduled',
                updatedAt: new Date(),
            });
        });
        await Promise.all(writeOps);
    }

    return {
        seededSemesterIds: [...seededSemesterIds],
        seededSemesters: [...seededSemestersById.values()],
        lectureCount,
    };
}

// ============================================================================
// FACULTY MANAGEMENT
// ============================================================================

async function loadFacultyList() {
    try {
        const snapshot = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('faculty')
            .where('status', '==', 'active')
            .get();

        const faculty = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const listDiv = document.getElementById('facultyList');
        if (!listDiv) return;

        listDiv.innerHTML = '';

        if (faculty.length === 0) {
            listDiv.innerHTML = '<p style="color: #666; padding: 15px;">No faculty added yet. Use the form above to add faculty members.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            `;

            faculty.forEach(f => {
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${f.name || '—'}</td>
                    <td>${f.phone || '—'}</td>
                    <td>${f.email || '—'}</td>
                    <td style="display: flex; gap: 8px;">
                        <button onclick="editFaculty('${f.id}')" class="primary-btn" style="padding: 6px 12px; font-size: 12px;">✏️ Edit</button>
                        <button onclick="removeFaculty('${f.id}')" class="danger-btn" style="padding: 6px 12px; font-size: 12px;">Delete</button>
                    </td>
                `;
            });

            listDiv.appendChild(table);
        }
    } catch (error) {
        showError(`Error loading faculty: ${error.message}`);
    }
}

async function showFacultyModal() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    cancelEditFaculty();
    document.getElementById('facultyModal').style.display = 'block';
    loadFacultyList();
}

function closeFacultyModal() {
    document.getElementById('facultyModal').style.display = 'none';
    cancelEditFaculty();
}

async function handleAddFaculty(event) {
    event.preventDefault();

    try {
        const name = document.getElementById('facultyName').value.trim();
        const phone = document.getElementById('facultyPhone').value.trim();
        const email = document.getElementById('facultyEmail').value.trim();

        if (!name || !phone || !email) {
            showStatus('addFacultyStatus', 'Please fill in all fields', 'warning');
            return;
        }

        await window.db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').add({
                name,
                phone,
                email,
                status: 'active',
                subjects: [],
                createdAt: new Date(),
            });

        // ====================================================================
        // SYNC WITH USERS COLLECTION: Ensure faculty can SEE the semester
        // ====================================================================
        try {
            const userQuery = await window.db.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();

            if (!userQuery.empty) {
                // User exists, append semester
                const userDoc = userQuery.docs[0];
                const existingSems = userDoc.data().semesters || [];
                if (!existingSems.includes(currentSemesterId)) {
                    existingSems.push(currentSemesterId);
                    await userDoc.ref.update({ semesters: existingSems });
                    console.log(`Updated existing faculty user ${email} with semester ${currentSemesterId}`);
                }
            } else {
                // User doesn't exist, create profile placeholder
                const facultyId = name.toLowerCase().replace(/[\s.]+/g, '_').replace(/[^a-z_]/g, '');
                await window.db.collection('users').doc(facultyId).set({
                    name,
                    email,
                    role: 'faculty',
                    semesters: [currentSemesterId],
                    facultyId: facultyId,
                    createdAt: new Date()
                });
                console.log(`Created new faculty profile for ${email}`);
            }
        } catch (syncErr) {
            console.error('User sync failed:', syncErr);
            // Non-blocking but good to know
        }

        document.querySelector('.faculty-form').reset();
        loadFacultyList();
        showStatus('addFacultyStatus', `✓ Faculty "${name}" added successfully.`, 'success');
        setTimeout(() => {
            const statusEl = document.getElementById('addFacultyStatus');
            if (statusEl) statusEl.textContent = '';
        }, 3000);
    } catch (error) {
        showStatus('addFacultyStatus', `Failed to add faculty: ${error.message}`, 'error');
    }
}

async function editFaculty(facultyId) {
    try {
        const docSnap = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').doc(facultyId).get();

        if (!docSnap.exists) {
            showError('Faculty not found');
            return;
        }

        const data = docSnap.data();
        
        // Populate edit form
        document.getElementById('editFacultyId').value = facultyId;
        document.getElementById('editFacultyName').value = data.name || '';
        document.getElementById('editFacultyPhone').value = data.phone || '';
        document.getElementById('editFacultyEmail').value = data.email || '';

        // Show edit section
        document.getElementById('editFacultySection').style.display = 'block';
        document.getElementById('editFacultyName').focus();

        // Scroll to top
        document.querySelector('.modal-content').scrollTop = 0;
    } catch (error) {
        showError(`Error loading faculty: ${error.message}`);
    }
}

async function handleEditFaculty(event) {
    event.preventDefault();

    try {
        const facultyId = document.getElementById('editFacultyId').value;
        const name = document.getElementById('editFacultyName').value.trim();
        const phone = document.getElementById('editFacultyPhone').value.trim();
        const email = document.getElementById('editFacultyEmail').value.trim();

        if (!name || !phone || !email) {
            showError('Please fill in all fields');
            return;
        }

        await window.db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').doc(facultyId).update({
                name,
                phone,
                email,
                updatedAt: new Date(),
            });

        cancelEditFaculty();
        loadFacultyList();
        const statusEl = document.getElementById('addFacultyStatus');
        showStatus('addFacultyStatus', `✓ Faculty "${name}" updated successfully.`, 'success');
        setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
        }, 3000);
    } catch (error) {
        showError(`Error updating faculty: ${error.message}`);
    }
}

function cancelEditFaculty() {
    document.getElementById('editFacultySection').style.display = 'none';
    document.getElementById('editFacultyId').value = '';
    document.getElementById('editFacultyName').value = '';
    document.getElementById('editFacultyPhone').value = '';
    document.getElementById('editFacultyEmail').value = '';
}

async function removeFaculty(facultyId) {
    if (!confirm('Remove this faculty member? This action cannot be undone.')) return;

    try {
        await window.db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').doc(facultyId).update({
                status: 'inactive',
                deletedAt: new Date(),
            });

        cancelEditFaculty();
        loadFacultyList();
        showStatus('addFacultyStatus', '✓ Faculty member removed.', 'success');
        setTimeout(() => {
            const statusEl = document.getElementById('addFacultyStatus');
            if (statusEl) statusEl.textContent = '';
        }, 3000);
    } catch (error) {
        showStatus('addFacultyStatus', `Error: ${error.message}`, 'error');
    }
}

// ============================================================================
// STUDENT SYNC
// ============================================================================

async function handleStudentSync(event) {
    event.preventDefault();

    if (!currentSemesterId) {
        showStatus('syncStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        showStatus('syncStatus', 'Syncing students... (implementing Google Forms API)', 'info');

        // TODO: Call Cloud Function to fetch Google Form responses
        // For now, show placeholder

        showStatus('syncStatus', 'Google Forms sync not yet implemented. Please contact support.', 'warning');
    } catch (error) {
        showStatus('syncStatus', `Sync failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

async function handleAnnouncement(event) {
    event.preventDefault();

    if (!currentSemesterId) {
        showStatus('announcementStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const title = document.getElementById('announcementTitle').value;
        const message = document.getElementById('announcementMsg').value;

        showStatus('announcementStatus', 'Sending announcement...', 'info');

        // Direct Firestore Write (Bypassing Cloud Functions for Free Tier)
        const announcementData = {
            type: 'announcement',
            title: title || 'New Announcement',
            message: message,
            fromName: 'Administrator',
            sentAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        };

        await window.db.collection('semesters').doc(currentSemesterId)
            .collection('notifications').add(announcementData);

        document.querySelector('.announcement-form').reset();
        showStatus('announcementStatus', '✓ Announcement sent to all students.', 'success');
    } catch (error) {
        showStatus('announcementStatus', `Failed to send: ${error.message}`, 'error');
    }
}

// ============================================================================
// NOTIFICATIONS LOG
// ============================================================================

async function showNotificationLog() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const notifications = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('notifications')
            .orderBy('sentAt', 'desc')
            .limit(50)
            .get();

        const listDiv = document.getElementById('notificationList');
        listDiv.innerHTML = '';

        if (notifications.empty) {
            listDiv.innerHTML = '<p>No notifications sent yet.</p>';
        } else {
            const list = document.createElement('div');
            list.className = 'notification-list';

            notifications.forEach(doc => {
                const notif = doc.data();
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.innerHTML = `
                    <strong>${notif.type}</strong><br>
                    <em>${notif.title}</em><br>
                    ${notif.message}<br>
                    <small>Sent: ${new Date(notif.sentAt.toDate()).toLocaleString()}</small>
                `;
                list.appendChild(item);
            });

            listDiv.appendChild(list);
        }

        document.getElementById('notificationModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading notifications: ${error.message}`);
    }
}

function closeNotificationModal() {
    document.getElementById('notificationModal').style.display = 'none';
}

// ============================================================================
// MESSAGE LOG (Simulated SMS/WhatsApp)
// ============================================================================

async function showMessageLog() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const snapshot = await window.db.collection('message_logs')
            .where('semesterId', '==', currentSemesterId)
            .get();

        const messages = snapshot.docs.map(doc => doc.data())
            .sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0))
            .slice(0, 200);

        const listDiv = document.getElementById('messageLogList');
        listDiv.innerHTML = '';

        if (messages.length === 0) {
            listDiv.innerHTML = '<p>No messages logged yet.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Date & Time</th>
                    <th>Enrollment No</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            `;

            messages.forEach(m => {
                const row = table.insertRow();
                const ts = m.timestamp ? new Date(m.timestamp.toDate()).toLocaleString() : '—';
                row.innerHTML = `
                    <td>${ts}</td>
                    <td>${m.enrollment_no || '—'}</td>
                    <td>${m.phone || '—'}</td>
                    <td>${m.message_type || '—'}</td>
                    <td>${m.status || '—'}</td>
                    <td><button class="primary-btn" onclick='showMessageDetails(${JSON.stringify(m).replace(/'/g, "\\'")})'>View</button></td>
                `;
            });

            listDiv.appendChild(table);
        }

        document.getElementById('messageLogModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading message log: ${error.message}`);
    }
}

function closeMessageLog() {
    document.getElementById('messageLogModal').style.display = 'none';
}

function showMessageDetails(message) {
    const detailsDiv = document.getElementById('messageDetails');
    const ts = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleString() : '—';

    detailsDiv.innerHTML = `
        <p><strong>To:</strong> ${message.phone || '—'}</p>
        <p><strong>Enrollment:</strong> ${message.enrollment_no || '—'}</p>
        <p><strong>Type:</strong> ${message.message_type || '—'}</p>
        <p><strong>Timestamp:</strong> ${ts}</p>
        <hr>
        <pre style="white-space:pre-wrap;">${message.message_body || ''}</pre>
        <p><strong>Status:</strong> ${message.status || '—'}</p>
    `;

    document.getElementById('messageDetailsModal').style.display = 'block';
}

function closeMessageDetails() {
    document.getElementById('messageDetailsModal').style.display = 'none';
}

// ============================================================================
// SEMESTER ARCHIVING
// ============================================================================

async function confirmArchiveSemester() {
    if (!currentSemesterId) {
        showStatus('archiveStatus', 'Please select a semester', 'warning');
        return;
    }

    const confirmMsg = `This will archive the semester and disable all student access. This cannot be undone. Continue?`;

    if (!confirm(confirmMsg)) return;

    try {
        showStatus('archiveStatus', 'Archiving semester...', 'info');

        // Mark semester as inactive
        await window.db.collection('semesters').doc(currentSemesterId).update({
            active: false,
        });

        // Mark all lectures as archived
        const lectures = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures').get();

        const batch = window.db.batch();
        lectures.forEach(doc => {
            batch.update(doc.ref, { status: 'archived' });
        });
        await batch.commit();

        // Mark all students as archived
        const students = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('students').get();

        const batch2 = window.db.batch();
        students.forEach(doc => {
            batch2.update(doc.ref, { status: 'archived' });
        });
        await batch2.commit();

        showStatus('archiveStatus', '✓ Semester archived successfully.', 'success');
        loadSemesters();
    } catch (error) {
        showStatus('archiveStatus', `Archive failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// SETTINGS
// ============================================================================

async function showSettingsModal() {
    try {
        const settings = await window.db.collection('admin_settings').doc('config').get();

        if (settings.exists) {
            const data = settings.data();
            document.getElementById('appName').value = data.appName || '';
            document.getElementById('institution').value = data.institution || '';
            document.getElementById('supportPhone').value = data.supportPhone || '';
            document.getElementById('deliveryMethod').value = data.credentialDeliveryMethod || 'sms';
            document.getElementById('semesterStartDate').value = data.semesterStartDate || '';
        }

        document.getElementById('settingsModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading settings: ${error.message}`);
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function handleSettingsSave(event) {
    event.preventDefault();

    try {
        const settings = {
            appName: document.getElementById('appName').value,
            institution: document.getElementById('institution').value,
            supportPhone: document.getElementById('supportPhone').value,
            credentialDeliveryMethod: document.getElementById('deliveryMethod').value,
            semesterStartDate: document.getElementById('semesterStartDate').value,
        };

        await window.db.collection('admin_settings').doc('config').set(settings, { merge: true });

        showStatus('uploadStatus', '✓ Settings saved.', 'success');
        closeSettingsModal();
    } catch (error) {
        showStatus('uploadStatus', `Failed to save settings: ${error.message}`, 'error');
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `status-message ${type}`;
    }
}

function showError(message) {
    console.error(message);
    alert('Error: ' + message);
}

function logout() {
    window.auth.signOut().then(() => {
        window.location.href = '/pages/login.html';
    }).catch(error => {
        showError(error.message);
    });
}
