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
const app = firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const functions = firebase.functions();

// Enable offline persistence (for data caching)
db.enablePersistence().catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
    }
});

// Make services globally available
window.firebaseApp = {
    auth,
    db,
    storage,
    functions,
    firebase
};

console.log('Firebase initialized successfully');
