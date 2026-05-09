const CACHE_NAME = 'lec-scheduler-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/admin.html',
  '/pages/faculty.html',
  '/pages/student.html',
  '/manifest.json',
  '/favicon.jpg',
  '/icon-192.jpg',
  '/icon-512.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});

// Handle Firebase Cloud Messaging push events (background notifications)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push notification data:', data);

    const notification = data.notification || {};
    const notificationTitle = notification.title || 'LecScheduler';
    const notificationOptions = {
      body: notification.body || '',
      icon: notification.icon || '/icon-192.jpg',
      badge: notification.badge || '/icon-192.jpg',
      image: notification.image || null,
      tag: data.tag || 'notification',
      requireInteraction: true,
      data: data.data || data
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (err) {
    console.error('[SW] Error handling push event:', err);
    // Fallback for text payload
    event.waitUntil(
      self.registration.showNotification('LecScheduler Notification', {
        body: event.data.text(),
        icon: '/icon-192.jpg',
        badge: '/icon-192.jpg',
        tag: 'notification',
        requireInteraction: true
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  event.notification.close();

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if window is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle message from clients
self.addEventListener('message', (event) => {
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

