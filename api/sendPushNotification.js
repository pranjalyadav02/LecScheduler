/**
 * Send Firebase Cloud Messaging (FCM) push notifications
 * Used by sendAnnouncement to send push notifications to students
 */

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

        const { semesterId, title, message, userIds, notificationType } = req.body;

        if (!semesterId || !title || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = admin.firestore();
        const messaging = admin.messaging();

        // Get FCM tokens for target users
        let users = [];
        
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            // Send to specific users
            for (const userId of userIds) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists && userDoc.data().fcmTokens) {
                    users.push(...userDoc.data().fcmTokens);
                }
            }
        } else {
            // Send to all students in semester
            const studentsSnapshot = await db.collection('semesters')
                .doc(semesterId)
                .collection('students')
                .get();

            for (const studentDoc of studentsSnapshot.docs) {
                const userId = studentDoc.data().userId || studentDoc.id;
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists && userDoc.data().fcmTokens) {
                    users.push(...userDoc.data().fcmTokens);
                }
            }
        }

        if (users.length === 0) {
            console.log('No FCM tokens found for users');
            return res.status(200).json({
                success: true,
                message: 'No push notifications sent (no tokens available)',
                tokenCount: 0
            });
        }

        // Remove duplicates
        const uniqueTokens = [...new Set(users)];

        // Prepare notification payload
        const multicastMessage = {
            notification: {
                title: title,
                body: message,
            },
            data: {
                semesterId: semesterId,
                type: notificationType || 'announcement',
                timestamp: new Date().toISOString(),
                tag: `notification-${Date.now()}`
            },
            tokens: uniqueTokens,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    channelId: 'high_importance_channel'
                }
            },
            webpush: {
                headers: {
                    'TTL': '3600'
                },
                notification: {
                    title: title,
                    body: message,
                    icon: '/icon-192.jpg',
                    badge: '/icon-192.jpg',
                    requireInteraction: true
                }
            }
        };

        // Send multicast message
        const response = await messaging.sendMulticast(multicastMessage);

        console.log(`Successfully sent ${response.successCount} push notifications`);

        if (response.failureCount > 0) {
            console.log(`Failed to send ${response.failureCount} push notifications`);
            
            // Clean up invalid tokens
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed token ${idx}:`, resp.error?.message);
                    failedTokens.push(uniqueTokens[idx]);
                }
            });

            // Remove invalid tokens from database
            if (failedTokens.length > 0) {
                for (const token of failedTokens) {
                    await db.collection('users').where('fcmTokens', 'array-contains', token)
                        .get()
                        .then(snapshot => {
                            snapshot.docs.forEach(doc => {
                                doc.ref.update({
                                    fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                                });
                            });
                        });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Push notification sent to ${response.successCount} devices`,
            successCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (error) {
        console.error('Error in sendPushNotification:', error);
        return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};
