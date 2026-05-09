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
        // Register and wait for the Firebase messaging service worker
        let registration = null;
        try {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;
            console.log('✓ Firebase messaging service worker registered (scope:', registration.scope, ')');
        } catch (err) {
            console.warn('Could not register Firebase messaging SW:', err);
        }

        // Get token from Firebase Messaging, prefer passing service worker registration
        const token = await window.messaging.getToken({
            vapidKey: 'BJ4LBbJp6W9fClW0ueEdHpSxMwOW90zaQEhULn9LztIIGDxOpPgTAu-vGVF1Y63ruC0oJgKt6hffVKld7wdCB6Y', // Web Push Certificate from Firebase Console
            serviceWorkerRegistration: registration || undefined
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

                // Show notification using Service Worker if available, otherwise use Notification API
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SHOW_NOTIFICATION',
                        title: title,
                        options: notificationOptions,
                        data: payload.data || {}
                    });
                } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    try {
                        new Notification(title, notificationOptions);
                    } catch (e) {
                        console.warn('Failed to show Notification via API:', e);
                    }
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
            // If permission was not granted, show an on-page prompt to the user
            if (typeof Notification !== 'undefined') {
                if (Notification.permission === 'default') {
                    showNotificationPermissionPrompt();
                } else if (Notification.permission === 'denied') {
                    console.warn('Notification permission denied. User must enable notifications from browser settings.');
                }
            }
            console.log('⚠ Notification permission not granted');
            return false;
        }
    } catch (error) {
        console.error('Error initializing messaging:', error);
        return false;
    }
}


/**
 * Show a small banner prompting the user to enable notifications.
 * The prompt must be triggered by a user gesture when requesting permission.
 */
function showNotificationPermissionPrompt() {
    try {
        // Avoid duplicate prompts
        if (document.getElementById('enableNotificationsBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'enableNotificationsBanner';
        banner.style.position = 'fixed';
        banner.style.bottom = '16px';
        banner.style.left = '16px';
        banner.style.right = '16px';
        banner.style.zIndex = 9999;
        banner.style.background = 'linear-gradient(90deg, #fff, #f7f7f7)';
        banner.style.border = '1px solid rgba(0,0,0,0.08)';
        banner.style.padding = '12px 14px';
        banner.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.justifyContent = 'space-between';
        banner.style.borderRadius = '6px';

        const text = document.createElement('div');
        text.style.flex = '1';
        text.style.marginRight = '12px';
        text.textContent = 'Enable notifications to receive important announcements in your device notification bar.';

        const actions = document.createElement('div');

        const enableBtn = document.createElement('button');
        enableBtn.textContent = 'Enable Notifications';
        enableBtn.style.marginRight = '8px';
        enableBtn.className = 'btn btn-primary';
        enableBtn.onclick = async () => {
            // This click is a user gesture — request permission now
            enableBtn.disabled = true;
            const token = await requestNotificationPermission();
            if (token) {
                setupMessageListener();
                banner.remove();
                console.log('Notifications enabled via prompt');
            } else {
                enableBtn.disabled = false;
                alert('Could not enable notifications. Please check your browser settings.');
            }
        };

        const dismiss = document.createElement('button');
        dismiss.textContent = 'Dismiss';
        dismiss.className = 'btn btn-secondary';
        dismiss.onclick = () => banner.remove();

        actions.appendChild(enableBtn);
        actions.appendChild(dismiss);

        banner.appendChild(text);
        banner.appendChild(actions);
        document.body.appendChild(banner);
    } catch (e) {
        console.warn('Failed to show notification prompt:', e);
    }
}

// Export for use in student.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeMessaging, requestNotificationPermission, getFCMToken };
}
