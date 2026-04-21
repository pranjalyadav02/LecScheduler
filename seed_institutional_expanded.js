/**
 * Full Master Seeder using REST API for all MCA Semesters (II, IV, VI, VIII)
 */

const PROJECT_ID = 'lecscheduler-4e36b';
const API_KEY = 'AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc';

const TIMETABLE_DATA = [
    {
        semesterId: 'mca_semester_ii',
        semesterName: 'MCA Semester II (Jan-May 2026)',
        sections: [
            {
                name: 'A', room: '201',
                faculties: {
                    'IC-205C': 'Ms. Shraddha Soni', 'IC-202C': 'Ms. Ragini Modi', 'IC-204B': 'Dr. Rajesh Verma',
                    'IC-201': 'Mr. Hemant Prakash Gavde', 'IC-206D': 'Dr. Pushpendra Dubey',
                    'IC-209D': 'Mr. Dheeraj Upadhayay', 'IC-210E': 'Mr. Anshul Satle'
                },
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
                faculties: {
                    'IC-205C': 'Ms. Shraddha Soni', 'IC-202C': 'Ms. Kirti Vijayvergia', 'IC-204B': 'Mr Prakshep Goswami',
                    'IC-201': 'Mr. Hemant Prakash Gavde', 'IC-206D': 'Dr. Pushpendra Dubey',
                    'IC-209D': 'Mr. Dheeraj Upadhayay', 'IC-210E': 'Mr. Rajesh Verma'
                },
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
        semesterName: 'MCA Semester IV (Jan-May 2026)',
        sections: [
            {
                name: 'A', room: '203',
                faculties: {
                    'IC-403D': 'Dr. Nitin Nagar', 'IC-402A': 'Dr. Rupesh Sendre', 'IC-405A': 'Dr. Vivek Shrivastav',
                    'IC-401C': 'Mr. Rajesh Verma', 'IC-406D': 'Dr. Monalisa Khatre',
                    'IC-408C': 'Mr. Pratham Jaiswal', 'IC-411C': 'Mr Prakshep Goswami'
                },
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
                faculties: {
                    'IC-403D': 'Mr. Pratham Jaiswal', 'IC-402A': 'Dr. Nitin Nagar', 'IC-405A': 'Dr. Vivek Shrivastava',
                    'IC-401C': 'Mr. Rajesh Verma', 'IC-406D': 'Dr. Monalisa Khatre',
                    'IC-408C': 'Mr. Pratham Jaiswal', 'IC-411C': 'Mr Prakshep Goswami'
                },
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
                    { days: ['Friday', 'Saturday'], time: '15:00-16:00', subject: 'DCC', code: 'IC-401C' },
                    { days: ['Friday', 'Saturday'], time: '16:00-17:00', subject: 'Eship', code: 'IC-406D' }
                ]
            }
        ]
    },
    {
        semesterId: 'mca_semester_vi',
        semesterName: 'MCA Semester VI (Jan-May 2026)',
        sections: [
            {
                name: 'A', room: '201',
                faculties: {
                    'IC-601': 'Dr. Poonam Mangwani', 'IC-602': 'Dr. Ajay Jaiswal', 'IC-604': 'Dr. Basant Namdeo',
                    'IC-603': 'Dr. Rahul Singhai', 'IC-606': 'Mr. Dheeraj Upadhayay', 'PROJECT': 'Faculty'
                },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '10:00-11:00', subject: 'HCI', code: 'IC-602' },
                    { days: ['Monday', 'Tuesday'], time: '11:00-12:00', subject: 'OS', code: 'IC-604' },
                    { days: ['Monday', 'Tuesday'], time: '12:00-13:00', subject: 'SAD', code: 'IC-603' },
                    { days: ['Monday', 'Tuesday'], time: '13:00-15:00', subject: 'Android prog. Lab', code: 'IC-606' },
                    { days: ['Wednesday', 'Thursday'], time: '08:00-10:00', subject: 'HCI', code: 'IC-602' },
                    { days: ['Wednesday', 'Thursday'], time: '11:00-12:00', subject: 'CC', code: 'IC-601' },
                    { days: ['Wednesday', 'Thursday'], time: '12:00-13:00', subject: 'OS', code: 'IC-604' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-15:00', subject: 'Project', code: 'PROJECT' },
                    { days: ['Friday', 'Saturday'], time: '11:00-12:00', subject: 'CC', code: 'IC-601' },
                    { days: ['Friday', 'Saturday'], time: '12:00-13:00', subject: 'SAD', code: 'IC-603' }
                ]
            },
            {
                name: 'B', room: '202',
                faculties: {
                    'IC-601': 'Dr Vivek Shrivastava', 'IC-602': 'Dr. Ajay Jaiswal', 'IC-604': 'Dr. Basant Namdeo',
                    'IC-603': 'Dr. Rahul Singhai', 'IC-606': 'Mr. Dheeraj Upadhayay', 'PROJECT': 'Faculty'
                },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '11:00-12:00', subject: 'SAD', code: 'IC-603' },
                    { days: ['Monday', 'Tuesday'], time: '12:00-13:00', subject: 'CC', code: 'IC-601' },
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'Project', code: 'PROJECT' },
                    { days: ['Wednesday', 'Thursday'], time: '11:00-12:00', subject: 'OS', code: 'IC-604' },
                    { days: ['Wednesday', 'Thursday'], time: '12:00-13:00', subject: 'SAD', code: 'IC-603' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-15:00', subject: 'Android prog.', code: 'IC-606' },
                    { days: ['Friday', 'Saturday'], time: '08:00-10:00', subject: 'HCI', code: 'IC-602' },
                    { days: ['Friday', 'Saturday'], time: '11:00-12:00', subject: 'CC', code: 'IC-601' },
                    { days: ['Friday', 'Saturday'], time: '12:00-13:00', subject: 'OS', code: 'IC-604' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'Project', code: 'PROJECT' }
                ]
            }
        ]
    },
    {
        semesterId: 'mca_semester_viii',
        semesterName: 'MCA Semester VIII (Jan-May 2026)',
        sections: [
            {
                name: 'A', room: '203',
                faculties: {
                    'IC-801B': 'Dr. Manju Suchdeo', 'IC-812A': 'Dr. Jugendra Dongre', 'IC-812': 'Dr. Yasmin Shaikh',
                    'IC-811B': 'Dr. Pradeep Jatav', 'IC-802B': 'Dr. Ramesh Thakur',
                    'IC-810D': 'Visiting Faculty', 'IC-813': 'Visiting Faculty'
                },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '10:00-12:00', subject: 'ECT', code: 'IC-802B' },
                    { days: ['Monday', 'Tuesday'], time: '12:00-13:00', subject: 'TOC', code: 'IC-812' },
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'DMW', code: 'IC-811B', room: '207' },
                    { days: ['Wednesday', 'Thursday'], time: '09:00-11:00', subject: 'ECT Lab', code: 'IC-810D' },
                    { days: ['Wednesday', 'Thursday'], time: '11:00-13:00', subject: 'MWC', code: 'IC-801B' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-14:00', subject: 'Soft Comp.', code: 'IC-812A' },
                    { days: ['Friday', 'Saturday'], time: '09:00-11:00', subject: 'MWC Lab', code: 'IC-813' },
                    { days: ['Friday', 'Saturday'], time: '11:00-12:00', subject: 'TOC', code: 'IC-812' },
                    { days: ['Friday', 'Saturday'], time: '12:00-13:00', subject: 'Soft Comp', code: 'IC-812A' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'DMW', code: 'IC-811B', room: '207' }
                ]
            },
            {
                name: 'B', room: '204',
                faculties: {
                    'IC-801B': 'Dr. Manju Suchdeo', 'IC-812A': 'Dr. Jugendra Dongre', 'IC-812': 'Dr. Yasmin Shaikh',
                    'IC-811B': 'Dr. Pradeep Jatav', 'IC-802B': 'Dr. Ramesh Thakur',
                    'IC-810D': 'Visiting Faculty', 'IC-813': 'Visiting Faculty'
                },
                schedule: [
                    { days: ['Monday', 'Tuesday'], time: '09:00-11:00', subject: 'ECT Lab', code: 'IC-810D' },
                    { days: ['Monday', 'Tuesday'], time: '11:00-13:00', subject: 'MWC', code: 'IC-801B' },
                    { days: ['Monday', 'Tuesday'], time: '13:00-14:00', subject: 'ECT', code: 'IC-802B', room: '208' },
                    { days: ['Wednesday', 'Thursday'], time: '09:00-11:00', subject: 'MWC Lab', code: 'IC-813' },
                    { days: ['Wednesday', 'Thursday'], time: '11:00-12:00', subject: 'TOC', code: 'IC-812' },
                    { days: ['Wednesday', 'Thursday'], time: '12:00-13:00', subject: 'Soft Comp.', code: 'IC-812A' },
                    { days: ['Wednesday', 'Thursday'], time: '13:00-14:00', subject: 'DMW', code: 'IC-811B', room: '208' },
                    { days: ['Friday', 'Saturday'], time: '10:00-11:00', subject: 'TOC', code: 'IC-812' },
                    { days: ['Friday', 'Saturday'], time: '11:00-12:00', subject: 'Soft Comp.', code: 'IC-812A' },
                    { days: ['Friday', 'Saturday'], time: '12:00-13:00', subject: 'DMW', code: 'IC-811B' },
                    { days: ['Friday', 'Saturday'], time: '13:00-14:00', subject: 'ECT', code: 'IC-802B', room: '208' }
                ]
            }
        ]
    }
];

async function seed() {
    process.stdout.write('🔑 Logging in as Admin...');
    const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@institution.edu', password: 'Admin@123456', returnSecureToken: true })
    });
    const { idToken } = await loginRes.json();
    if (!idToken) { console.log(' failed.'); return; }
    console.log(' success.');

    for (const sem of TIMETABLE_DATA) {
        process.stdout.write(`📡 Seeding ${sem.semesterId}...`);
        
        for (const section of sem.sections) {
            for (const item of section.schedule) {
                const facultyName = section.faculties[item.code] || 'TBA';
                // Normalize name: remove Dr., Mr., Ms., etc. for the ID
                const normalizedName = facultyName.replace(/^(dr|mr|ms|mrs)\.?\s+/i, '');
                const fId = normalizedName.toLowerCase().replace(/[\s.]+/g, '_').replace(/[^a-z_]/g, '');

                for (const day of item.days) {
                    const [start, end] = item.time.split('-');
                    const lectureId = `${day}_${start.replace(':','')}_${section.name}_${item.code}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
                    
                    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/semesters/${sem.semesterId}/lectures/${lectureId}?updateMask.fieldPaths=subject&updateMask.fieldPaths=code&updateMask.fieldPaths=day&updateMask.fieldPaths=startTime&updateMask.fieldPaths=endTime&updateMask.fieldPaths=room&updateMask.fieldPaths=section&updateMask.fieldPaths=faculty&updateMask.fieldPaths=facultyId&updateMask.fieldPaths=status`;
                    
                    await fetch(url, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fields: {
                                subject: { stringValue: item.subject },
                                code: { stringValue: item.code || '' },
                                day: { stringValue: day },
                                startTime: { stringValue: start },
                                endTime: { stringValue: end },
                                room: { stringValue: item.room || section.room },
                                section: { stringValue: section.name },
                                faculty: { stringValue: facultyName },
                                facultyId: { stringValue: fId },
                                status: { stringValue: 'scheduled' }
                            }
                        })
                    });
                }
            }
        }
        console.log(' done.');
    }
    console.log('✅ MASTER DATA EXPANSION COMPLETE!');
}

seed();
