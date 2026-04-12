const admin = require('./lib/firebase-admin');

module.exports = async (req, res) => {
    try {
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

        const { semesterId, students } = req.body;
        const db = admin.firestore();

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ error: 'Invalid students data' });
        }

        let createdCount = 0;
        const batchSize = 400; // Safe batch size
        const batches = [];

        for (let i = 0; i < students.length; i += batchSize) {
            const chunk = students.slice(i, i + batchSize);
            const batch = db.batch();

            chunk.forEach(student => {
                const { enrollmentNo, name, phone } = student;
                if (enrollmentNo && phone) {
                    const ref = db.collection('semesters').doc(semesterId).collection('students').doc(enrollmentNo);
                    batch.set(ref, {
                        enrollmentNo,
                        name: name || `Student ${enrollmentNo}`,
                        phone,
                        status: 'active',
                        authCreated: false,
                        passwordChanged: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    createdCount++;
                }
            });
            batches.push(batch.commit());
        }

        await Promise.all(batches);

        return res.status(200).json({
            success: true,
            message: `Successfully processed ${createdCount} students.`
        });

    } catch (error) {
        console.error('Error in batchCreateStudents:', error);
        return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};
