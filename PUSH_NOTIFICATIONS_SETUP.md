# Android Push Notifications Setup Guide

## Overview
Push notifications now display in the Android notification bar. This requires Firebase Cloud Messaging (FCM) setup.

## What Was Implemented

### Frontend Changes:
1. **Firebase Messaging SDK** - Added to student.html
2. **messaging-service.js** - Handles FCM token registration and permission requests
3. **firebase-messaging-sw.js** - Service worker for background notifications
4. **Updated sw.js** - Handles push event and notification clicks
5. **student.js** - Calls initializeMessaging() on login

### Backend Changes:
1. **sendAnnouncement.js** - Updated to send FCM push notifications
2. **sendPushNotification.js** - New API for sending push notifications
3. **Firestore** - Stores FCM tokens in users collection

## Configuration Required in Firebase Console

### Step 1: Get Web Push Certificate (VAPID Key)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `lecscheduler-4e36b`
3. Go to Project Settings → Cloud Messaging tab
4. Under "Web Configuration", click "Generate Key Pair"
5. Copy the public key (VAPID Key)

### Step 2: Update VAPID Key in Code
Update the VAPID key in two files:
- `frontend/js/messaging-service.js` - Line 46
- `frontend/firebase-messaging-sw.js` - Line 28

Replace: `BJVXQ-Hcxvz_w7RvJCPHvYLtP5iTPKQ79VN-OV_1PnLvNmeLz5bEzFe_l7_LTQ6yGhV7Lr_4j3c7Jx8F-VpCfzQ`

With your actual VAPID key from Firebase Console.

### Step 3: Configure Android App (if building APK/AAB)

If you're using Capacitor or Flutter to build Android app:

#### For Capacitor:
```bash
npm install @capacitor/push-notifications
npx cap add android
```

#### For Flutter:
```bash
flutter pub add firebase_messaging
```

Configure `google-services.json` from Firebase Console.

## How It Works

### On Android:
1. User logs in to app
2. App requests notification permission
3. Firebase generates FCM token
4. Token is stored in Firestore linked to user
5. When admin sends announcement:
   - Announcement saved to Firestore
   - FCM push notification sent to all student devices
   - Notification appears in Android notification bar

### On Web/PWA:
1. Same flow as Android
2. Notifications appear as browser notifications when app is open
3. Background notifications via Firebase Messaging Service Worker

## Testing

### Test Push Notifications:
1. Login as student on Android device
2. Check browser console: "✓ FCM Token obtained"
3. Login as admin/faculty
4. Send announcement
5. Check student device notification bar - notification should appear

### Troubleshooting:
- **No notifications?** 
  - Check VAPID key is correct
  - Verify notification permission is granted
  - Check browser console for errors
  - Check "Send as test message" in Firebase Console Cloud Messaging tab

- **Tokens not saved?**
  - Check Firestore rules allow updates
  - Verify user collection exists
  - Check browser console for errors

## Files Modified:
- `frontend/pages/student.html` - Added Firebase Messaging script
- `frontend/js/firebase-config.js` - Initialize Firebase Messaging
- `frontend/js/student.js` - Call initializeMessaging() on login
- `frontend/js/messaging-service.js` - NEW: FCM token management
- `frontend/sw.js` - Handle push events and notification clicks
- `frontend/firebase-messaging-sw.js` - NEW: Background notification handler
- `api/sendAnnouncement.js` - Send FCM notifications
- `api/sendPushNotification.js` - NEW: Push notification API

## Firebase Permissions
Ensure Firestore rules allow:
- Users can update their own fcmTokens array
- Authenticated users can read/write notifications

Recommended rules:
```javascript
match /users/{userId} {
  allow write: if request.auth.uid == userId;
  allow read: if request.auth.uid == userId;
}

match /semesters/{semesterId}/notifications/{document=**} {
  allow read: if true;  // Students can read
}
```

## Production Notes
- VAPID key is public and safe to include in code
- FCM tokens expire and are automatically refreshed
- Invalid tokens are automatically removed from Firestore
- Notifications are sent via Firebase Admin SDK (backend)
