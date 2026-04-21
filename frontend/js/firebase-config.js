// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

// Firebase configuration for lecscheduler-4e36b
const firebaseConfig = {
    apiKey: "AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc",
    authDomain: "lecscheduler-4e36b.firebaseapp.com",
    projectId: "lecscheduler-4e36b",
    storageBucket: "lecscheduler-4e36b.firebasestorage.app",
    messagingSenderId: "114388534580",
    appId: "1:114388534580:web:971a79bcfef075d7985161",
    measurementId: "G-90W2DL6GQN"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services (ensuring single initialization)
if (!window.db) {
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = (typeof firebase.storage === "function") ? firebase.storage() : null;
    window.functions = firebase.functions();
}

const authService = window.auth;
const dbService = window.db;
const storageService = window.storage;
const functionsService = window.functions;

// ============================================================================
// EMULATOR DETECTION (Development Mode) - DISABLED FOR NOW (Java required)
// ============================================================================
// Firestore Emulator requires Java. For now, we connect to production Firebase.
// To enable emulators:
// 1. Install Java 11+
// 2. Set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
// 3. Run: firebase emulators:start
// 4. Uncomment the code below
// 
// const hostname = window.location.hostname;
// const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
// 
// if (isDevelopment) {
//     db.useEmulator('127.0.0.1', 8080);
//     auth.useEmulator('http://127.0.0.1:9099');
//     functions.useEmulator('127.0.0.1', 5001);
// }

// Enable offline persistence
try {
    dbService.enablePersistence().then(() => {
        console.log('✓ Firestore offline persistence enabled');
    }).catch(err => {
        if (err.code === 'failed-precondition') {
            console.log('Multiple tabs open; offline persistence disabled');
        } else if (err.code === 'unimplemented') {
            console.log('Browser does not support offline persistence');
        } else {
            console.log('Offline persistence error:', err.message);
        }
    });
} catch (err) {
    console.log('Could not enable offline persistence:', err.message);
}

// Make services globally available
window.firebaseApp = {
    auth: authService,
    db: dbService,
    storage: storageService,
    functions: functionsService,
    firebase
};

// Also expose them as window globals for convenience (will be available after this script loads)
window.auth = authService;
window.db = dbService;
window.storage = storageService;
window.functions = functionsService;

// Expose a promise that resolves when firebase is initialized
window.firebaseReady = (async function waitForInit() {
    try {
        // Quick check for services
        if (!window.firebase || !window.firebase.firestore || !window.firebase.auth) {
            throw new Error('Firebase SDK not loaded');
        }
        // Wait a tick for any async setup
        await new Promise(r => setTimeout(r, 50));
        console.log('Firebase initialized successfully');
        return true;
    } catch (err) {
        console.error('Firebase initialization failed:', err.message);
        return false;
    }
})();

console.log('Firebase configuration executed');
