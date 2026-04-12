








const admin = require('./lib/firebase-admin');

module.exports = async (req, res) => {
    try {
        // CORS headers
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        );

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { enrollmentNo, phone, semesterId } = req.body;
        const db = admin.firestore();
        const auth = admin.auth();

        if (!enrollmentNo || !phone || !semesterId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify enrollment
        const studentRef = db.collection('semesters').doc(semesterId).collection('students').doc(enrollmentNo);
        const studentDoc = await studentRef.get();

        if (!studentDoc.exists) {
            return res.status(404).json({ error: 'Enrollment number not found in this semester.' });
        }

        // Generate password
        const password = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 3).toUpperCase();

        // Create Auth User
        try {
            await auth.createUser({
                uid: enrollmentNo,
                email: `${enrollmentNo}@lec-scheduler.local`,
                password: password,
                displayName: studentDoc.data().name,
                disabled: false,
            });
        } catch (authError) {
            if (authError.code === 'auth/uid-already-exists') {
                // If user exists, just update password
                await auth.updateUser(enrollmentNo, { password: password });
            } else {
                throw authError;
            }
        }

        // Update DB
        await studentRef.update({
            authCreated: true,
            passwordChanged: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Log message for delivery (Mock SMS)
        const messageBody = `Your LecScheduler account\nUsername: ${enrollmentNo}\nPassword: ${password}\nPlease login and change your password.`;
        await db.collection('message_logs').add({
            semesterId,
            enrollment_no: enrollmentNo,
            phone,
            message_type: 'LOGIN_CREDENTIALS',
            message_body: messageBody,
            status: 'SENT',
            delivery_method: 'sms',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({
            success: true,
            message: `Credentials generated for ${enrollmentNo}. Check Message Log.`
        });

    } catch (error) {
        console.error('Error in createStudentAuth:', error);
        return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};
