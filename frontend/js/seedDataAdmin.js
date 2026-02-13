/**
 * BROWSER-BASED SEED DATA TOOL
 * 
 * Run this in the browser console to populate Firestore with test data.
 * Open the admin dashboard, then paste this into the browser console:
 * 
 * await seedTestData();
 */

async function seedTestData() {
    // Wait for firebaseApp to be initialized by firebase-config.js
    // Wait for firebaseReady promise if available
    if (window.firebaseReady) {
        console.log('Waiting on window.firebaseReady...');
        const ok = await window.firebaseReady;
        if (!ok) {
            throw new Error('Firebase initialization failed. Check console for details.');
        }
    } else {
        // Fallback: wait longer and provide diagnostics
        let attempts = 0;
        const maxAttempts = 200; // ~20 seconds

        // If firebase SDK isn't loaded, try dynamically loading it
        if (typeof window.firebase === 'undefined') {
            console.log('Firebase SDK not detected. Attempting to load SDK scripts dynamically (compat first)...');
            // Prefer compat build which provides the familiar namespaced `firebase` global
            const compatLibs = [
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
            ];

            for (const src of compatLibs) {
                if (!document.querySelector(`script[src="${src}"]`)) {
                    await new Promise((resolve) => {
                        const s = document.createElement('script');
                        s.src = src;
                        s.onload = () => { console.log(`Loaded ${src}`); resolve(); };
                        s.onerror = () => { console.error(`Failed to load ${src}`); resolve(); };
                        document.head.appendChild(s);
                    });
                }
            }

            // If compat failed, try modular v10 scripts as fallback
            if (typeof window.firebase === 'undefined') {
                console.log('Compat SDK did not expose global firebase, trying modular SDK...');
                const libs = [
                    'https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js',
                    'https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js',
                    'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js'
                ];

                for (const src of libs) {
                    if (!document.querySelector(`script[src="${src}"]`)) {
                        await new Promise((resolve) => {
                            const s = document.createElement('script');
                            s.src = src;
                            s.onload = () => { console.log(`Loaded ${src}`); resolve(); };
                            s.onerror = () => { console.error(`Failed to load ${src}`); resolve(); };
                            document.head.appendChild(s);
                        });
                    }
                }
            }
        }

        while (!window.firebaseApp && attempts < maxAttempts) {
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`Still waiting for firebaseApp... (${attempts * 100}ms)`);
                console.log('Diagnostics:', {
                    windowFirebase: typeof window.firebase !== 'undefined',
                    windowFirebaseApp: !!window.firebaseApp,
                    windowFirebaseReady: !!window.firebaseReady,
                    scripts: Array.from(document.scripts).slice(-10).map(s => s.src).filter(Boolean),
                });
            }
            await new Promise(r => setTimeout(r, 100));
        }

        if (!window.firebaseApp) {
            console.error('Timeout waiting for firebaseApp. Ensure firebase-config.js is loaded and scripts are not blocked.');
        }
    }

    // Fallbacks if firebaseApp still undefined
    let fbApp = window.firebaseApp || {};
    let db = fbApp.db || null;
    let auth = fbApp.auth || null;

    // If firebase SDK exists, check if apps are initialized without calling methods that may throw
    const hasFirebase = typeof window.firebase !== 'undefined';
    const hasApps = hasFirebase && Array.isArray(window.firebase.apps) && window.firebase.apps.length > 0;

    try {
        if (hasApps) {
            try {
                db = db || window.firebase.firestore();
                auth = auth || window.firebase.auth();
            } catch (innerErr) {
                console.warn('firebase.firestore() threw despite apps present:', innerErr.message);
            }
        }
    } catch (outerErr) {
        console.warn('Error while probing firebase.apps:', outerErr.message);
    }

    // If firebase SDK exists but no app initialized, initialize it here (safe and idempotent)
    const fallbackConfig = {
        apiKey: "AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc",
        authDomain: "lecscheduler-4e36b.firebaseapp.com",
        projectId: "lecscheduler-4e36b",
        storageBucket: "lecscheduler-4e36b.firebasestorage.app",
        messagingSenderId: "114388534580",
        appId: "1:114388534580:web:971a79bcfef075d7985161",
        measurementId: "G-90W2DL6GQN"
    };

    if ((!db || !auth) && hasFirebase) {
        try {
            if (!hasApps) {
                console.log('No firebase app found. Initializing fallback app');
                window._seedFirebaseApp = window.firebase.initializeApp(fallbackConfig);
            } else {
                console.log('Firebase SDK present and apps already initialized (but services may not be available yet)');
            }

            // Initialize services after app exists
            try {
                db = db || window.firebase.firestore();
                auth = auth || window.firebase.auth();
            } catch (innerErr) {
                console.error('Failed to access firestore/auth after initializeApp:', innerErr.message);
            }

            // Expose firebaseApp for consistency
            if (!window.firebaseApp && db && auth) {
                const fbObj = { auth, db, firebase: window.firebase };
                try { fbObj.storage = window.firebase.storage(); } catch (e) { /* storage not available */ }
                try { fbObj.functions = window.firebase.functions(); } catch (e) { /* functions not available */ }
                window.firebaseApp = fbObj;
                console.log('window.firebaseApp set by seed helper');
            }
        } catch (err) {
            console.error('Failed to initialize fallback Firebase app:', err && err.message ? err.message : err);
        }
    }

    if (!db || !auth) {
        throw new Error('Firebase not initialized. Make sure firebase-config.js is loaded and the page has finished loading.');
    }

    console.log('🌱 Starting seed data creation...\n');
    
    try {
        // =====================================================================
        // 1. CREATE ADMIN USER
        // =====================================================================
        console.log('📝 Step 1: Ensuring admin user exists...');
        try {
            // Prefer creating the user to ensure known credentials
            await auth.createUserWithEmailAndPassword('admin@institution.edu', 'Admin@123456');
            console.log('✓ Admin user created');
        } catch (err) {
            if (err && err.code === 'auth/email-already-in-use') {
                console.log('Admin email already in use; attempting sign-in to verify credentials');
                try {
                    await auth.signInWithEmailAndPassword('admin@institution.edu', 'Admin@123456');
                    console.log('✓ Signed in as admin');
                } catch (signErr) {
                    console.warn('Could not sign in with admin credentials (existing account may use different password):', signErr.code || signErr.message);
                    // Continue — admin profile may still be created if auth user exists and we can get uid from currentUser
                }
            } else {
                console.warn('createUserWithEmailAndPassword failed:', err && (err.code || err.message));
            }
        }

        // Get current user (may be null if sign-in not performed)
        let adminUser = auth.currentUser;
        if (!adminUser) {
            // Try to sign-in silently (if account exists but not signed in)
            try {
                await auth.signInWithEmailAndPassword('admin@institution.edu', 'Admin@123456');
                adminUser = auth.currentUser;
            } catch (err) {
                console.warn('Could not sign in to retrieve admin UID:', err && (err.code || err.message));
            }
        }

        if (!adminUser) {
            // As a last resort, create a UID document for admin without auth (use a fixed uid)
            console.warn('Admin auth not available; creating admin profile document with fixed uid "admin-seed"');
            adminUser = { uid: 'admin-seed' };
        }
        
        // Get current user
        const adminUser = auth.currentUser;
        if (!adminUser) {
            throw new Error('Could not get admin user');
        }
        
        // =====================================================================
        // 2. CREATE ADMIN PROFILE IN FIRESTORE
        // =====================================================================
        console.log('\n📋 Step 2: Creating admin profile...');
        await db.collection('users').doc(adminUser.uid).set({
            uid: adminUser.uid,
            email: 'admin@institution.edu',
            displayName: 'System Administrator',
            role: 'admin',
            phone: '+91-9999999999',
            semesters: ['sem-2024-s1'],
            createdAt: new Date(),
        }, { merge: true });
        console.log('✓ Admin profile created');
        
        // =====================================================================
        // 3. CREATE TEST SEMESTER
        // =====================================================================
        console.log('\n📅 Step 3: Creating test semester...');
        await db.collection('semesters').doc('sem-2024-s1').set({
            id: 'sem-2024-s1',
            name: 'Spring 2024 - Test Semester',
            active: true,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-05-31'),
            createdAt: new Date(),
        }, { merge: true });
        console.log('✓ Semester created: sem-2024-s1');
        
        // =====================================================================
        // 4. CREATE SAMPLE FACULTY
        // =====================================================================
        console.log('\n👨‍🏫 Step 4: Creating sample faculty...');
        const facultyData = [
            { name: 'Dr. Smith', phone: '+91-9876543210', email: 'smith@institution.edu' },
            { name: 'Prof. Johnson', phone: '+91-9876543211', email: 'johnson@institution.edu' },
            { name: 'Dr. Williams', phone: '+91-9876543212', email: 'williams@institution.edu' },
        ];
        
        for (const faculty of facultyData) {
            await db.collection('semesters').doc('sem-2024-s1')
                .collection('faculty').add({
                    name: faculty.name,
                    phone: faculty.phone,
                    email: faculty.email,
                    status: 'active',
                    subjects: [],
                    createdAt: new Date(),
                });
        }
        console.log(`✓ ${facultyData.length} faculty members created`);
        
        // =====================================================================
        // 5. CREATE SAMPLE STUDENTS
        // =====================================================================
        console.log('\n👥 Step 5: Creating sample students...');
        const studentData = [
            { enrollmentNo: 'ENG2024001', name: 'Alice Johnson', phone: '+91-9000000001' },
            { enrollmentNo: 'ENG2024002', name: 'Bob Smith', phone: '+91-9000000002' },
            { enrollmentNo: 'ENG2024003', name: 'Carol White', phone: '+91-9000000003' },
            { enrollmentNo: 'ENG2024004', name: 'David Brown', phone: '+91-9000000004' },
            { enrollmentNo: 'ENG2024005', name: 'Emma Davis', phone: '+91-9000000005' },
        ];
        
        for (const student of studentData) {
            await db.collection('semesters').doc('sem-2024-s1')
                .collection('students').doc(student.enrollmentNo).set({
                    enrollmentNo: student.enrollmentNo,
                    name: student.name,
                    phone: student.phone,
                    status: 'active',
                    authCreated: false,
                    passwordChanged: false,
                    createdAt: new Date(),
                }, { merge: true });
        }
        console.log(`✓ ${studentData.length} students created`);
        
        // =====================================================================
        // 6. CREATE SAMPLE LECTURES
        // =====================================================================
        console.log('\n📚 Step 6: Creating sample lectures...');
        const lectureData = [
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
        
        for (const lecture of lectureData) {
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
                    createdAt: new Date(),
                });
        }
        console.log(`✓ ${lectureData.length} lectures created`);
        
        // =====================================================================
        // 7. CREATE ADMIN SETTINGS
        // =====================================================================
        console.log('\n⚙️ Step 7: Creating admin settings...');
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
        console.log('\n💬 Step 8: Creating sample message logs...');
        const messageLogs = [
            {
                semesterId: 'sem-2024-s1',
                enrollment_no: 'ENG2024001',
                phone: '+91-9000000001',
                message_type: 'LOGIN_CREDENTIALS',
                message_body: 'Your LecScheduler account\nUsername: ENG2024001\nPassword: Test@1234\nPlease login and change your password.',
                status: 'SENT',
                delivery_method: 'sms',
                timestamp: new Date(),
            },
            {
                semesterId: 'sem-2024-s1',
                enrollment_no: 'ENG2024002',
                phone: '+91-9000000002',
                message_type: 'LECTURE_UPDATE',
                message_body: 'Alert: Your Data Structures lecture on Monday has been rescheduled to 9:00 AM (Room 101).',
                status: 'SENT',
                delivery_method: 'sms',
                timestamp: new Date(),
            },
            {
                semesterId: 'sem-2024-s1',
                enrollment_no: 'ENG2024003',
                phone: '+91-9000000003',
                message_type: 'ANNOUNCEMENT',
                message_body: 'Attention: All students must submit their assignments by Friday EOD. Late submissions will not be accepted.',
                status: 'SENT',
                delivery_method: 'sms',
                timestamp: new Date(),
            },
        ];
        
        for (const log of messageLogs) {
            await db.collection('message_logs').add(log);
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
        console.log('  Students: 5 (ENG2024001 - ENG2024005)');
        console.log('  Lectures: 6 (various subjects)');
        console.log('  Faculty: 3 members');
        console.log('  Message Logs: 3 samples');
        console.log('\n✨ You can now log in as admin!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    }
}

console.log('✓ Seed data helper loaded. Run: await seedTestData()');
