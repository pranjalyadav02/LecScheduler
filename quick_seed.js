#!/usr/bin/env node

/**
 * QUICK SEED SCRIPT
 * Creates test data for Lecture Scheduler
 */

const firebase = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-config/service-account-key.json');

if (!firebase.apps.length) {
    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        projectId: 'lecscheduler-4e36b'
    });
}

const db = firebase.firestore();

async function seedData() {
    try {
        console.log('🌱 Starting to seed test data...');

        // Create semester
        const semesterRef = db.collection('semesters').doc('semester-1');
        await semesterRef.set({
            name: 'MCA Semester 1',
            academicYear: '2025-2026',
            startDate: '2026-01-01',
            endDate: '2026-05-31',
            status: 'active',
            createdAt: new Date()
        });
        console.log('✅ Semester created');

        // Create students
        const students = [
            { uid: 'student-1', name: 'Priya Sharma', enrollmentNo: 'MCA2026001', email: 'priya.sharma@college.ac.in' },
            { uid: 'student-2', name: 'Rahul Kumar', enrollmentNo: 'MCA2026002', email: 'rahul.kumar@college.ac.in' },
            { uid: 'student-3', name: 'Anjali Patel', enrollmentNo: 'MCA2026003', email: 'anjali.patel@college.ac.in' },
            { uid: 'student-4', name: 'Vikram Singh', enrollmentNo: 'MCA2026004', email: 'vikram.singh@college.ac.in' },
            { uid: 'student-5', name: 'Neha Gupta', enrollmentNo: 'MCA2026005', email: 'neha.gupta@college.ac.in' }
        ];

        for (const student of students) {
            await semesterRef.collection('students').doc(student.uid).set({
                ...student,
                semester: 'semester-1',
                createdAt: new Date()
            });
        }
        console.log('✅ Students created');

        // Create faculty
        const faculty = [
            { uid: 'faculty-1', name: 'Dr. Rajesh Verma', email: 'dr_rajesh_verma@college.ac.in', department: 'Computer Science' },
            { uid: 'faculty-2', name: 'Prof. Anita Desai', email: 'anita.desai@college.ac.in', department: 'Computer Science' },
            { uid: 'faculty-3', name: 'Dr. Amit Kumar', email: 'amit.kumar@college.ac.in', department: 'Mathematics' }
        ];

        for (const fac of faculty) {
            await semesterRef.collection('faculty').doc(fac.uid).set({
                ...fac,
                semester: 'semester-1',
                createdAt: new Date()
            });
        }
        console.log('✅ Faculty created');

        // Create sample lectures
        const lectures = [
            {
                uid: 'lecture-1',
                subject: 'Data Structures',
                facultyName: 'Dr. Rajesh Verma',
                facultyUid: 'faculty-1',
                day: 'Monday',
                startTime: '09:00',
                endTime: '10:30',
                room: 'Lab-101',
                type: 'Theory'
            },
            {
                uid: 'lecture-2',
                subject: 'Algorithms',
                facultyName: 'Prof. Anita Desai',
                facultyUid: 'faculty-2',
                day: 'Tuesday',
                startTime: '11:00',
                endTime: '12:30',
                room: 'Room-201',
                type: 'Theory'
            },
            {
                uid: 'lecture-3',
                subject: 'Mathematics',
                facultyName: 'Dr. Amit Kumar',
                facultyUid: 'faculty-3',
                day: 'Wednesday',
                startTime: '14:00',
                endTime: '15:30',
                room: 'Room-301',
                type: 'Theory'
            }
        ];

        for (const lecture of lectures) {
            await semesterRef.collection('lectures').doc(lecture.uid).set({
                ...lecture,
                semester: 'semester-1',
                status: 'scheduled',
                createdAt: new Date()
            });
        }
        console.log('✅ Lectures created');

        // Create user accounts for testing
        const users = [
            { uid: 'admin-1', role: 'admin', name: 'System Admin', email: 'admin@institution.edu' },
            ...students.map(s => ({ uid: s.uid, role: 'student', name: s.name, email: s.email, semester: 'semester-1' })),
            ...faculty.map(f => ({ uid: f.uid, role: 'faculty', name: f.name, email: f.email, semesters: ['semester-1'] }))
        ];

        for (const user of users) {
            await db.collection('users').doc(user.uid).set({
                ...user,
                createdAt: new Date()
            });
        }
        console.log('✅ User accounts created');

        console.log('\n🎉 Test data seeded successfully!');
        console.log('\n📊 Test Credentials:');
        console.log('Admin: admin@institution.edu / Admin@123456');
        console.log('Student: MCA2026001 / Default@1234');
        console.log('Faculty: dr_rajesh_verma@college.ac.in / Test@123478');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
}

seedData().then(() => {
    process.exit(0);
});
