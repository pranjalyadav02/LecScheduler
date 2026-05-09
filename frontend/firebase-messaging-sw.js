/**
 * Firebase Cloud Messaging service worker handler
 * This file handles push notifications in the background
 * Place this in the public root directory
 */

// Give the service worker access to Firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
    apiKey: "AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc",
    authDomain: "lecscheduler-4e36b.firebaseapp.com",
    projectId: "lecscheduler-4e36b",
    storageBucket: "lecscheduler-4e36b.firebasestorage.app",
    messagingSenderId: "114388534580",
    appId: "1:114388534580:web:971a79bcfef075d7985161",
    measurementId: "G-90W2DL6GQN"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Configure messaging with VAPID key
if (typeof messaging.getToken === 'function') {
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message:', payload);

        const notification = payload.notification || {};
        const title = notification.title || 'LecScheduler';
        const options = {
            body: notification.body || 'You have a new notification',
            icon: notification.icon || '/icon-192.jpg',
            badge: notification.badge || '/icon-192.jpg',
            image: notification.image || null,
            tag: payload.data?.tag || 'notification',
            requireInteraction: true,
            data: payload.data || {}
        };

        return self.registration.showNotification(title, options);
    });
}

// Fallback: Handle background messages for older versions
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notification = payload.notification || {};
    const title = notification.title || 'LecScheduler';
    const options = {
        body: notification.body || 'You have a new notification',
        icon: notification.icon || '/icon-192.jpg',
        badge: notification.badge || '/icon-192.jpg',
        image: notification.image || null,
        tag: payload.data?.tag || 'notification',
        requireInteraction: true,
        data: payload.data || {}
    };

    return self.registration.showNotification(title, options);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Check if window is already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
