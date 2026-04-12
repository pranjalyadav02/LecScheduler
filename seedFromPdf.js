/**
 * TIMETABLE SEEDER - Uses Firestore REST API (no credentials needed)
 * Based on: Updated_MCA_TT_Jan_May_12012026 (1).pdf
 * 
 * Usage: node seedFromPdf.js
 */

const PROJECT_ID = 'lecscheduler-4e36b';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function firestoreSet(collection, docId, data) {
    const fields = toFirestoreFields(data);
    const url = `${BASE_URL}/${collection}/${encodeURIComponent(docId)}`;
    const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const res = await fetch(`${url}?${mask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Firestore PATCH failed (${res.status}): ${err}`);
    }
    return res.json();
}

async function firestoreAdd(collection, data) {
    const fields = toFirestoreFields(data);
    const res = await fetch(`${BASE_URL}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Firestore POST failed (${res.status}): ${err}`);
    }
    return res.json();
}

function toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
        else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map(i => ({ stringValue: i })) } };
        else if (typeof v === 'object' && v._serverTimestamp) fields[k] = { timestampValue: new Date().toISOString() };
        else if (typeof v === 'object') fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
    }
    return fields;
}

const NOW = { _serverTimestamp: true };

// ─── TIMETABLE DATA (from PDF) ───────────────────────────────────────────────

const SEMESTERS = [
    {
        id: 'mca_semester_ii',
        name: 'MCA SEMESTER II',
        programCode: 'MCA',
        semesterNo: 2,
        academicYear: 'Jan-May 2026',
        status: 'active',
        sections: ['A', 'B'],
        createdFrom: 'pdf-seed'
    },
    {
        id: 'mca_semester_iv',
        name: 'MCA SEMESTER IV',
        programCode: 'MCA',
        semesterNo: 4,
        academicYear: 'Jan-May 2026',
        status: 'active',
        sections: ['A', 'B'],
        createdFrom: 'pdf-seed'
    }
];

const FACULTY_LIST = [
    { name: 'Ms. Shraddha Soni',       email: 'shraddha.soni@college.ac.in',       role: 'faculty', subjects: ['Object Oriented Programming Using C++'],     semesters: ['mca_semester_ii', 'mca_semester_iv'] },
    { name: 'Ms. Ragini Modi',          email: 'ragini.modi@college.ac.in',          role: 'faculty', subjects: ['Internet & Web Programming'],                  semesters: ['mca_semester_ii'] },
    { name: 'Ms. Kirti Vijayvergia',    email: 'kirti.vijayvergia@college.ac.in',    role: 'faculty', subjects: ['Internet & Web Programming'],                  semesters: ['mca_semester_ii'] },
    { name: 'Dr. Rajesh Verma',         email: 'rajesh.verma@college.ac.in',         role: 'faculty', subjects: ['Digital Computer Organization', 'IWP Lab'],    semesters: ['mca_semester_ii', 'mca_semester_iv'] },
    { name: 'Mr. Hemant Prakash Gavde', email: 'hemant.gavde@college.ac.in',         role: 'faculty', subjects: ['Mathematics-II', 'Mathematics-IV'],            semesters: ['mca_semester_ii', 'mca_semester_iv'] },
    { name: 'Dr. Pushpendra Dubey',     email: 'pushpendra.dubey@college.ac.in',     role: 'faculty', subjects: ['Hindi'],                                       semesters: ['mca_semester_ii', 'mca_semester_iv'] },
    { name: 'Mr. Dheeraj Upadhayay',   email: 'dheeraj.upadhayay@college.ac.in',    role: 'faculty', subjects: ['Oops Lab using C++'],                          semesters: ['mca_semester_ii'] },
    { name: 'Mr. Anshul Satle',        email: 'anshul.satle@college.ac.in',         role: 'faculty', subjects: ['IWP Lab'],                                     semesters: ['mca_semester_ii'] },
    { name: 'Mr. Prakshep Goswami',    email: 'prakshep.goswami@college.ac.in',     role: 'faculty', subjects: ['Digital Computer Organization'],               semesters: ['mca_semester_ii'] },
    { name: 'Ms. Anuradha Savita',     email: 'anuradha.savita@college.ac.in',      role: 'faculty', subjects: ['Software Engineering', 'Computer Networks'],   semesters: ['mca_semester_iv'] },
    { name: 'Mr. Siddharth Chouhan',   email: 'siddharth.chouhan@college.ac.in',    role: 'faculty', subjects: ['Design & Analysis of Algorithms'],             semesters: ['mca_semester_iv'] },
    { name: 'Ms. Sonal Shrivas',       email: 'sonal.shrivas@college.ac.in',        role: 'faculty', subjects: ['Advanced Database Management'],                semesters: ['mca_semester_iv'] },
    { name: 'Mr. Tarun Mishra',        email: 'tarun.mishra@college.ac.in',         role: 'faculty', subjects: ['DAA Lab', 'DBMS Lab'],                        semesters: ['mca_semester_iv'] },
];

const LECTURES = [
    // ── MCA SEM II / SECTION A ───────────────────────────────────────────────
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'MON', startTime: '11:00', endTime: '13:00', subject: 'Oops Lab using C++',                      faculty: 'Mr. Dheeraj Upadhayay',   type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'MON', startTime: '13:00', endTime: '14:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Ragini Modi',          type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'MON', startTime: '14:00', endTime: '15:00', subject: 'Digital Computer Organization',            faculty: 'Dr. Rajesh Verma',         type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'MON', startTime: '15:00', endTime: '16:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'MON', startTime: '16:00', endTime: '17:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'TUE', startTime: '11:00', endTime: '13:00', subject: 'Oops Lab using C++',                      faculty: 'Mr. Dheeraj Upadhayay',   type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'TUE', startTime: '13:00', endTime: '14:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Ragini Modi',          type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'TUE', startTime: '14:00', endTime: '15:00', subject: 'Digital Computer Organization',            faculty: 'Dr. Rajesh Verma',         type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'TUE', startTime: '15:00', endTime: '16:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'TUE', startTime: '16:00', endTime: '17:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'WED', startTime: '11:00', endTime: '13:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'WED', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'WED', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'WED', startTime: '15:00', endTime: '16:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Ragini Modi',          type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'THU', startTime: '11:00', endTime: '13:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'THU', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'THU', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'THU', startTime: '15:00', endTime: '16:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Ragini Modi',          type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'FRI', startTime: '11:00', endTime: '13:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'FRI', startTime: '13:00', endTime: '14:00', subject: 'Digital Computer Organization',            faculty: 'Dr. Rajesh Verma',         type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: 'Lab', day: 'FRI', startTime: '14:00', endTime: '16:00', subject: 'IWP Lab',                                 faculty: 'Mr. Anshul Satle',         type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'SAT', startTime: '11:00', endTime: '13:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: '201', day: 'SAT', startTime: '13:00', endTime: '14:00', subject: 'Digital Computer Organization',            faculty: 'Dr. Rajesh Verma',         type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'A', room: 'Lab', day: 'SAT', startTime: '14:00', endTime: '16:00', subject: 'IWP Lab',                                 faculty: 'Mr. Anshul Satle',         type: 'Lab' },

    // ── MCA SEM II / SECTION B ───────────────────────────────────────────────
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'MON', startTime: '11:00', endTime: '12:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Kirti Vijayvergia',    type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'MON', startTime: '12:00', endTime: '13:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'MON', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'MON', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'TUE', startTime: '11:00', endTime: '12:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Kirti Vijayvergia',    type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'TUE', startTime: '12:00', endTime: '13:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'TUE', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'TUE', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: 'Lab', day: 'WED', startTime: '11:00', endTime: '13:00', subject: 'Oops Lab using C++',                      faculty: 'Mr. Dheeraj Upadhayay',   type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'WED', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'WED', startTime: '14:00', endTime: '15:00', subject: 'Digital Computer Organization',            faculty: 'Mr. Prakshep Goswami',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'WED', startTime: '15:00', endTime: '16:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: 'Lab', day: 'THU', startTime: '11:00', endTime: '13:00', subject: 'Oops Lab using C++',                      faculty: 'Mr. Dheeraj Upadhayay',   type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'THU', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-II',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'THU', startTime: '14:00', endTime: '15:00', subject: 'Digital Computer Organization',            faculty: 'Mr. Prakshep Goswami',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'THU', startTime: '15:00', endTime: '16:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: 'Lab', day: 'FRI', startTime: '11:00', endTime: '13:00', subject: 'IWP Lab',                                 faculty: 'Dr. Rajesh Verma',         type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'FRI', startTime: '13:00', endTime: '14:00', subject: 'Digital Computer Organization',            faculty: 'Mr. Prakshep Goswami',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'FRI', startTime: '14:00', endTime: '15:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Kirti Vijayvergia',    type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'FRI', startTime: '15:00', endTime: '16:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: 'Lab', day: 'SAT', startTime: '11:00', endTime: '13:00', subject: 'IWP Lab',                                 faculty: 'Dr. Rajesh Verma',         type: 'Lab' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'SAT', startTime: '13:00', endTime: '14:00', subject: 'Digital Computer Organization',            faculty: 'Mr. Prakshep Goswami',     type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'SAT', startTime: '14:00', endTime: '15:00', subject: 'Internet & Web Programming',               faculty: 'Ms. Kirti Vijayvergia',    type: 'Lecture' },
    { semesterId: 'mca_semester_ii', section: 'B', room: '202', day: 'SAT', startTime: '15:00', endTime: '16:00', subject: 'Object Oriented Programming Using C++',   faculty: 'Ms. Shraddha Soni',        type: 'Lecture' },

    // ── MCA SEM IV / SECTION A ───────────────────────────────────────────────
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'MON', startTime: '11:00', endTime: '12:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'MON', startTime: '12:00', endTime: '13:00', subject: 'Design & Analysis of Algorithms',         faculty: 'Mr. Siddharth Chouhan',    type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'MON', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'MON', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'TUE', startTime: '11:00', endTime: '12:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'TUE', startTime: '12:00', endTime: '13:00', subject: 'Design & Analysis of Algorithms',         faculty: 'Mr. Siddharth Chouhan',    type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'TUE', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'TUE', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: 'Lab', day: 'WED', startTime: '11:00', endTime: '13:00', subject: 'DAA Lab',                                  faculty: 'Mr. Tarun Mishra',         type: 'Lab' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'WED', startTime: '13:00', endTime: '14:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'WED', startTime: '14:00', endTime: '15:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'WED', startTime: '15:00', endTime: '16:00', subject: 'Design & Analysis of Algorithms',         faculty: 'Mr. Siddharth Chouhan',    type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: 'Lab', day: 'THU', startTime: '11:00', endTime: '13:00', subject: 'DBMS Lab',                                 faculty: 'Mr. Tarun Mishra',         type: 'Lab' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'THU', startTime: '13:00', endTime: '14:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'THU', startTime: '14:00', endTime: '15:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'THU', startTime: '15:00', endTime: '16:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'FRI', startTime: '11:00', endTime: '12:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'FRI', startTime: '12:00', endTime: '13:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'FRI', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'SAT', startTime: '11:00', endTime: '12:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'SAT', startTime: '12:00', endTime: '13:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'A', room: '301', day: 'SAT', startTime: '13:00', endTime: '14:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },

    // ── MCA SEM IV / SECTION B ───────────────────────────────────────────────
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'MON', startTime: '11:00', endTime: '12:00', subject: 'Design & Analysis of Algorithms',         faculty: 'Mr. Siddharth Chouhan',    type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'MON', startTime: '12:00', endTime: '13:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'MON', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'MON', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'TUE', startTime: '11:00', endTime: '12:00', subject: 'Design & Analysis of Algorithms',         faculty: 'Mr. Siddharth Chouhan',    type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'TUE', startTime: '12:00', endTime: '13:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'TUE', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'TUE', startTime: '14:00', endTime: '15:00', subject: 'Hindi',                                    faculty: 'Dr. Pushpendra Dubey',     type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: 'Lab', day: 'WED', startTime: '11:00', endTime: '13:00', subject: 'DBMS Lab',                                 faculty: 'Mr. Tarun Mishra',         type: 'Lab' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'WED', startTime: '13:00', endTime: '14:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'WED', startTime: '14:00', endTime: '15:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'WED', startTime: '15:00', endTime: '16:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: 'Lab', day: 'THU', startTime: '11:00', endTime: '13:00', subject: 'DAA Lab',                                  faculty: 'Mr. Tarun Mishra',         type: 'Lab' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'THU', startTime: '13:00', endTime: '14:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'THU', startTime: '14:00', endTime: '15:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'THU', startTime: '15:00', endTime: '16:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'FRI', startTime: '11:00', endTime: '12:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'FRI', startTime: '12:00', endTime: '13:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'FRI', startTime: '13:00', endTime: '14:00', subject: 'Mathematics-IV',                           faculty: 'Mr. Hemant Prakash Gavde', type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'SAT', startTime: '11:00', endTime: '12:00', subject: 'Advanced Database Management',             faculty: 'Ms. Sonal Shrivas',        type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'SAT', startTime: '12:00', endTime: '13:00', subject: 'Computer Networks',                        faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
    { semesterId: 'mca_semester_iv', section: 'B', room: '302', day: 'SAT', startTime: '13:00', endTime: '14:00', subject: 'Software Engineering',                    faculty: 'Ms. Anuradha Savita',      type: 'Lecture' },
];

// ─── MAIN SEEDER ─────────────────────────────────────────────────────────────

async function runSeeding() {
    console.log('🚀 LecScheduler Timetable Seeder\n');
    console.log(`   Project: ${PROJECT_ID}`);
    console.log(`   Semesters: ${SEMESTERS.map(s => s.id).join(', ')}`);
    console.log(`   Faculty: ${FACULTY_LIST.length} members | Lectures: ${LECTURES.length}\n`);

    // 1. Seed Semesters
    console.log('📅 Seeding semesters...');
    for (const sem of SEMESTERS) {
        try {
            await firestoreSet('semesters', sem.id, sem);
            console.log(`   ✅ ${sem.id}`);
        } catch (e) {
            console.error(`   ❌ ${sem.id}: ${e.message}`);
        }
    }

    // 2. Seed Faculty (into root 'users' collection)
    console.log('\n👨‍🏫 Seeding faculty users...');
    for (const faculty of FACULTY_LIST) {
        const docId = faculty.name.toLowerCase().replace(/[\s.]+/g, '_').replace(/[^a-z_]/g, '');
        try {
            await firestoreSet('users', docId, {
                ...faculty,
                uid: docId,
                createdFrom: 'pdf-seed',
                createdAt: NOW
            });
            console.log(`   ✅ ${faculty.name} → users/${docId}`);
        } catch (e) {
            console.error(`   ❌ ${faculty.name}: ${e.message}`);
        }
    }

    // 3. Seed Lectures
    console.log('\n📚 Seeding lectures...');
    let successCount = 0;
    let failCount = 0;
    for (const lec of LECTURES) {
        const path = `semesters/${lec.semesterId}/lectures`;
        try {
            await firestoreAdd(path, {
                ...lec,
                status: 'scheduled',
                createdFrom: 'pdf-seed',
                createdAt: NOW
            });
            successCount++;
        } catch (e) {
            console.error(`   ❌ ${lec.semesterId} ${lec.section} ${lec.day} ${lec.startTime}: ${e.message}`);
            failCount++;
        }
    }
    console.log(`   ✅ ${successCount} lectures seeded  (${failCount} failed)`);

    // 4. Summary
    console.log('\n' + '═'.repeat(55));
    console.log('✅  SEEDING COMPLETE!');
    console.log('═'.repeat(55));
    console.log(`   Semesters : ${SEMESTERS.length}`);
    console.log(`   Faculty   : ${FACULTY_LIST.length}`);
    console.log(`   Lectures  : ${successCount}`);
    console.log(`\n   Open Firestore to verify:`);
    console.log(`   https://console.firebase.google.com/project/${PROJECT_ID}/firestore`);
    console.log('═'.repeat(55));
}

runSeeding().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
