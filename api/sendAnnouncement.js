const admin = require('./lib/firebase-admin');

module.exports = async (req, res) => {
    try {
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

        const { semesterId, title, message } = req.body;

        if (!semesterId || !title || !message) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const db = admin.firestore();

        await db.collection('semesters').doc(semesterId).collection('notifications').add({
            type: 'announcement',
            title,
            message,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent'
        });

        return res.status(200).json({
            success: true,
            message: 'Announcement sent successfully'
        });

    } catch (error) {
        console.error('Error in sendAnnouncement:', error);
        return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};
