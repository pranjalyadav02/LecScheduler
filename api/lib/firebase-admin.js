const admin = require('firebase-admin');

console.log('Firebase Admin: Initialization check...');
try {
    if (!admin.apps.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.log('Firebase Admin: Using FIREBASE_SERVICE_ACCOUNT');
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
            console.log('Firebase Admin: Initialized with service account');
        } else {
            console.warn('Firebase Admin: FIREBASE_SERVICE_ACCOUNT not set. Attempting default initialization...');
            admin.initializeApp({
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
            console.log('Firebase Admin: Initialized using default credentials');
        }
    }
} catch (error) {
    console.error('Firebase Admin: CRITICAL Initialization Error:', error.message);
    // On Vercel, this log will go to the runtime logs
}

module.exports = admin;
