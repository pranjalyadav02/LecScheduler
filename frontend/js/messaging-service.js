/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification setup for Android and other platforms
 */

let fcmToken = null;

/**
 * Request notification permission and register for FCM
 */
async function requestNotificationPermission() {
    try {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        // Check if permission already granted
        if (Notification.permission === 'granted') {
            console.log('Notification permission already granted');
            return await getFCMToken();
        }

        // Request permission
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✓ Notification permission granted');
                return await getFCMToken();
            }
        }

        return null;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return null;
    }
}

/**
 * Get or create FCM token
 */
async function getFCMToken() {
    try {
        if (!window.messaging) {
            console.warn('Firebase Messaging not available');
            return null;
        }

        // Register service worker for Firebase Messaging
        try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✓ Firebase messaging service worker registered');
        } catch (err) {
            console.warn('Could not register Firebase messaging SW:', err);
        }

        // Get token from Firebase Messaging
        const token = await window.messaging.getToken({
            vapidKey: 'BJ4LBbJp6W9fClW0ueEdHpSxMwOW90zaQEhULn9LztIIGDxOpPgTAu-vGVF1Y63ruC0oJgKt6hffVKld7wdCB6Y' // Web Push Certificate from Firebase Console
        });

        if (token) {
            fcmToken = token;
            console.log('✓ FCM Token obtained:', token.substring(0, 20) + '...');
            await saveFCMTokenToDatabase(token);
            return token;
        }

        return null;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Save FCM token to Firestore linked to current user
 */
async function saveFCMTokenToDatabase(token) {
    try {
        const user = window.auth.currentUser;
        if (!user) {
            console.warn('No authenticated user to save FCM token');
            return;
        }

        // Save token to user's profile in Firestore
        await window.db.collection('users').doc(user.uid).update({
            fcmTokens: window.firebase.firestore.FieldValue.arrayUnion(token),
            lastTokenUpdate: window.firebase.firestore.FieldValue.serverTimestamp()
        }).catch(async (err) => {
            // If user doc doesn't exist, create it
            if (err.code === 'not-found') {
                await window.db.collection('users').doc(user.uid).set({
                    fcmTokens: [token],
                    lastTokenUpdate: window.firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } else {
                throw err;
            }
        });

        console.log('✓ FCM token saved to database');
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
}

/**
 * Handle incoming push messages in foreground
 */
function setupMessageListener() {
    try {
        if (!window.messaging) {
            console.warn('Firebase Messaging not available');
            return;
        }

        window.messaging.onMessage((payload) => {
            console.log('📬 Message received in foreground:', payload);

            // Handle notification data
            if (payload.notification) {
                const { title, body, icon, badge, image } = payload.notification;
                const notificationOptions = {
                    body: body || '',
                    icon: icon || '/icon-192.jpg',
                    badge: badge || '/icon-192.jpg',
                    image: image || null,
                    tag: payload.data?.tag || 'notification',
                    requireInteraction: true
                };

                // Show notification using Service Worker
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SHOW_NOTIFICATION',
                        title: title,
                        options: notificationOptions,
                        data: payload.data || {}
                    });
                }
            }

            // Reload notifications if user is on the app
            if (window.location.pathname.includes('student') && typeof loadNotifications === 'function') {
                loadNotifications();
            }
        });

        console.log('✓ Foreground message listener set up');
    } catch (error) {
        console.error('Error setting up message listener:', error);
    }
}

/**
 * Initialize messaging service
 * Call this after user logs in
 */
async function initializeMessaging() {
    try {
        console.log('Initializing messaging service...');
        
        // Request permission and get token
        const token = await requestNotificationPermission();
        
        if (token) {
            // Set up foreground message handler
            setupMessageListener();
            console.log('✓ Messaging service initialized');
            return true;
        } else {
            console.log('⚠ Notification permission not granted');
            return false;
        }
    } catch (error) {
        console.error('Error initializing messaging:', error);
        return false;
    }
}

// Export for use in student.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeMessaging, requestNotificationPermission, getFCMToken };
}
