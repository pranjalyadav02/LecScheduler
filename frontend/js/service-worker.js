// ============================================================================
// SERVICE WORKER FOR OFFLINE SUPPORT
// Caches timetable data and enables offline viewing
// ============================================================================

const CACHE_NAME = 'lec-scheduler-v1';
const urlsToCache = [
    '/',
    '/pages/login.html',
    '/pages/student.html',
    '/css/admin.css',
    '/js/firebase-config.js',
    '/js/student.js',
];

// Install service worker and cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cache basic files
            return cache.addAll(urlsToCache).catch((err) => {
                console.log('Cache addAll error (non-critical):', err);
                // Continue even if some files fail to cache
            });
        })
    );
    self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch strategy: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Firebase/Google requests (they handle themselves)
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('gstatic') ||
        event.request.url.includes('google')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return response;
            })
            .catch(() => {
                // Return cached version if offline
                return caches.match(event.request).then((response) => {
                    return response || new Response(
                        'Offline: Content not available',
                        { status: 503, statusText: 'Service Unavailable' }
                    );
                });
            })
    );
});

// Handle messages from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
