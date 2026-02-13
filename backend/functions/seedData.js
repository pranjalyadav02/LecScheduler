/**
 * SEED DATA SCRIPT
 * 
 * Populates Firestore with test data for demo purposes.
 * 
 * Usage:
 * 1. npm install --save firebase-admin
 * 2. node backend/functions/seedData.js
 * 
 * This script creates:
 * - Admin user (admin@institution.edu / Admin@123456)
 * - Test semester (sem-2024-s1)
 * - 5 sample students
 * - 6 sample lectures
 * - 3 faculty members
 * - Sample message logs
 */

const admin = require('firebase-admin');

console.log('🔧 Initializing Firebase Admin SDK...');

// Initialize using environment or default to localhost
const useEmulator = process.env.USE_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST;

try {
    if (useEmulator) {
        console.log('📍 Connecting to Firestore Emulator...');
        // Emulator mode - no credentials needed
        admin.initializeApp({
            projectId: 'lecscheduler-4e36b',
        });
        process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    } else {
        console.log('📍 Connecting to production Firebase (lecscheduler-4e36b)...');
        // Production mode - use default credentials
        admin.initializeApp({
            projectId: 'lecscheduler-4e36b'
        });
    }
} catch (err) {
    console.log('⚠️ Firebase initialization warning:', err.message);
}

const db = admin.firestore();
const auth = admin.auth();

console.log('✓ Firebase Admin SDK initialized');

async function seedData() {
    try {
        console.log('🌱 Seeding test data...\n');

        // =====================================================================
        // 1. CREATE ADMIN USER (Firebase Auth)
        // =====================================================================
        console.log('📝 Creating admin user...');
        let adminUser;
        try {
            adminUser = await auth.getUserByEmail('admin@institution.edu');
            console.log('✓ Admin user already exists');
        } catch (err) {
            adminUser = await auth.createUser({
                uid: 'admin-test',
                email: 'admin@institution.edu',
                password: 'Admin@123456',
                displayName: 'System Administrator',
            });
            console.log('✓ Admin user created:', adminUser.uid);
        }

        // =====================================================================
        // 2. CREATE ADMIN DOCUMENT IN FIRESTORE
        // =====================================================================
        console.log('\n📋 Creating admin profile...');
        await db.collection('users').doc('admin-test').set({
            uid: 'admin-test',
            email: 'admin@institution.edu',
            displayName: 'System Administrator',
            role: 'admin',
            phone: '+91-9999999999',
            semesters: ['sem-2024-s1'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log('✓ Admin profile created');

        // =====================================================================
        // 3. CREATE SEMESTER
        // =====================================================================
        console.log('\n📅 Creating test semester...');
        const semesterData = {
            id: 'sem-2024-s1',
            name: 'Spring 2024 - Test Semester',
            active: true,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-05-31'),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('semesters').doc('sem-2024-s1').set(semesterData, { merge: true });
        console.log('✓ Semester created: sem-2024-s1');

        // =====================================================================
        // 4. CREATE SAMPLE FACULTY
        // =====================================================================
        console.log('\n👨‍🏫 Creating sample faculty...');
        const facultyList = [
            { name: 'Dr. Smith', phone: '+91-9876543210', email: 'smith@institution.edu' },
            { name: 'Prof. Johnson', phone: '+91-9876543211', email: 'johnson@institution.edu' },
            { name: 'Dr. Williams', phone: '+91-9876543212', email: 'williams@institution.edu' },
        ];

        for (const faculty of facultyList) {
            await db.collection('semesters').doc('sem-2024-s1')
                .collection('faculty').add({
                    name: faculty.name,
                    phone: faculty.phone,
                    email: faculty.email,
                    status: 'active',
                    subjects: [],
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
        }
        console.log(`✓ ${facultyList.length} faculty members created`);

        // =====================================================================
        // 5. CREATE SAMPLE STUDENTS
        // =====================================================================
        console.log('\n👥 Creating sample students...');
        const studentList = [
            { enrollmentNo: 'ENG2024001', name: 'Alice Johnson', phone: '+91-9000000001' },
            { enrollmentNo: 'ENG2024002', name: 'Bob Smith', phone: '+91-9000000002' },
            { enrollmentNo: 'ENG2024003', name: 'Carol White', phone: '+91-9000000003' },
            { enrollmentNo: 'ENG2024004', name: 'David Brown', phone: '+91-9000000004' },
            { enrollmentNo: 'ENG2024005', name: 'Emma Davis', phone: '+91-9000000005' },
        ];

        for (const student of studentList) {
            await db.collection('semesters').doc('sem-2024-s1')
                .collection('students').doc(student.enrollmentNo).set({
                    enrollmentNo: student.enrollmentNo,
                    name: student.name,
                    phone: student.phone,
                    status: 'active',
                    authCreated: false,
                    passwordChanged: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
        }
        console.log(`✓ ${studentList.length} students created`);

        // =====================================================================
        // 6. CREATE SAMPLE LECTURES
        // =====================================================================
        console.log('\n📚 Creating sample lectures...');
        const lectureList = [
            {
                subject: 'Data Structures',
                faculty: 'Dr. Smith',
                day: 'Monday',
                startTime: '10:00',
                endTime: '11:00',
                room: 'Room 101',
            },
            {
                subject: 'Algorithms',
                faculty: 'Prof. Johnson',
                day: 'Monday',
                startTime: '11:00',
                endTime: '12:00',
                room: 'Room 102',
            },
            {
                subject: 'Database Systems',
                faculty: 'Dr. Williams',
                day: 'Tuesday',
                startTime: '10:00',
                endTime: '11:00',
                room: 'Room 103',
            },
            {
                subject: 'Web Development',
                faculty: 'Dr. Smith',
                day: 'Wednesday',
                startTime: '14:00',
                endTime: '15:30',
                room: 'Lab 201',
            },
            {
                subject: 'Machine Learning',
                faculty: 'Prof. Johnson',
                day: 'Thursday',
                startTime: '10:00',
                endTime: '11:30',
                room: 'Room 104',
            },
            {
                subject: 'Operating Systems',
                faculty: 'Dr. Williams',
                day: 'Friday',
                startTime: '09:00',
                endTime: '10:30',
                room: 'Lab 202',
            },
        ];

        for (const lecture of lectureList) {
            await db.collection('semesters').doc('sem-2024-s1')
                .collection('lectures').add({
                    subject: lecture.subject,
                    faculty: lecture.faculty,
                    day: lecture.day,
                    startTime: lecture.startTime,
                    endTime: lecture.endTime,
                    room: lecture.room,
                    status: 'scheduled',
                    isCombined: false,
                    createdFrom: 'seed-data',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
        }
        console.log(`✓ ${lectureList.length} lectures created`);

        // =====================================================================
        // 7. CREATE ADMIN SETTINGS
        // =====================================================================
        console.log('\n⚙️ Creating admin settings...');
        await db.collection('admin_settings').doc('config').set({
            appName: 'Lecture Scheduler',
            institution: 'Test Institution',
            supportPhone: '+91-9999999999',
            supportEmail: 'support@institution.edu',
            credentialDeliveryMethod: 'sms',
        }, { merge: true });
        console.log('✓ Admin settings created');

        // =====================================================================
        // 8. CREATE SAMPLE MESSAGE LOGS
        // =====================================================================
        console.log('\n💬 Creating sample message logs...');
        const messageLogs = [
            {
                semesterId: 'sem-2024-s1',
                enrollment_no: 'ENG2024001',
                phone: '+91-9000000001',
                message_type: 'LOGIN_CREDENTIALS',
                message_body: 'Your LecScheduler account\nUsername: ENG2024001\nPassword: Test@1234\nPlease login and change your password.',
                status: 'SENT',
                delivery_method: 'sms',
            },
            {
                semesterId: 'sem-2024-s1',
                enrollment_no: 'ENG2024002',
                phone: '+91-9000000002',
                message_type: 'LECTURE_UPDATE',
                message_body: 'Alert: Your Data Structures lecture on Monday has been rescheduled to 9:00 AM (Room 101).',
                status: 'SENT',
                delivery_method: 'sms',
            },
        ];

        for (const log of messageLogs) {
            await db.collection('message_logs').add({
                ...log,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        console.log(`✓ ${messageLogs.length} message logs created`);

        // =====================================================================
        // SUMMARY
        // =====================================================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ SEED DATA COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📖 TEST CREDENTIALS:');
        console.log('  Role: Admin');
        console.log('  Email: admin@institution.edu');
        console.log('  Password: Admin@123456');
        console.log('\n📚 TEST SEMESTER: sem-2024-s1');
        console.log('  Name: Spring 2024 - Test Semester');
        console.log('  Students: 5 (ENG2024001 - ENG2024005)');
        console.log('  Lectures: 6 (various subjects)');
        console.log('  Faculty: 3 members');
        console.log('\n💾 DATA STORED IN:');
        console.log('  - collections/users');
        console.log('  - collections/semesters');
        console.log('  - collections/message_logs');
        console.log('  - collections/admin_settings');
        console.log('\n✨ Ready to demo!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

// Run seed if this is the main module
if (require.main === module) {
    seedData().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedData };
