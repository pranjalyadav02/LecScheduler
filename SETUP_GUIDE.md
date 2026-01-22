# 🚀 Lecture Scheduler - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Project Setup](#firebase-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Setup](#frontend-setup)
6. [User Management](#user-management)
7. [Testing & Launch](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview {#overview}

**Lecture Scheduler** is a low-complexity, automation-first academic scheduling system designed for institutions with limited resources and non-technical staff.

### Key Features
- **Automation-First**: PDF upload → automatic lecture creation
- **Role-Based Access**: Admin, Faculty, Student with strict permissions
- **Offline-Friendly**: Local caching + service worker support
- **Mobile-Ready**: Fully responsive web application
- **Zero Installation**: Web-only, no plugins or installations required

### Technology Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Messaging**: Firebase Cloud Messaging (optional)

---

## 2. Prerequisites {#prerequisites}

### For Admins/Developers
- Google Cloud Console access
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 18+ installed
- Git (optional)
- A text editor or IDE

### For Users
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Mobile phone with SMS capability (for credential delivery)

---

## 3. Firebase Project Setup {#firebase-setup}

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a new project"**
3. Enter project name: `LecScheduler`
4. Accept terms and click **"Create project"**
5. Wait for project creation (2-3 minutes)

### Step 2: Enable Firebase Services

#### Firestore Database
1. Go to **Build** → **Firestore Database**
2. Click **"Create Database"**
3. Choose **Location**: Select region closest to your institution
4. Click **"Create"**
5. Go to **Rules** tab and replace with content from `firestore-rules.txt`
6. Click **"Publish"**

#### Authentication
1. Go to **Build** → **Authentication**
2. Click **"Get Started"**
3. Click **Email/Password** and toggle **"Enable"**
4. Click **"Save"**

#### Storage
1. Go to **Build** → **Storage**
2. Click **"Get Started"**
3. Choose **Location** and click **"Next"**
4. Accept rules and click **"Done"**
5. Create a folder: **Rules** → Click **"Create folder"**
6. Name it: `timetables` → Click **"Create"**

#### Cloud Functions
1. Go to **Build** → **Functions**
2. Click **"Get started in Cloud Functions"**
3. Follow the setup wizard (you'll deploy functions later)

### Step 3: Get Firebase Config

1. Go to **Project Settings** (⚙️ icon, top left)
2. Click **"Your apps"**
3. Click **"Add app"** → Select **"Web"** (</> icon)
4. Enter name: `lecture-scheduler-web`
5. Click **"Register app"**
6. Copy the Firebase config object
7. Open `frontend/js/firebase-config.js`
8. Replace the placeholder `firebaseConfig` with your actual config

Example:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_FROM_CONSOLE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};
```

---

## 4. Backend Deployment {#backend-deployment}

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Initialize Firebase in Backend

```bash
cd backend/functions
firebase init
```

When prompted:
- Select **"Functions"**
- Choose your Firebase project from the list
- Select **JavaScript**
- Install dependencies when prompted

### Step 3: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

**Output**: Note the function URLs (you'll use these in the frontend)

### Verify Functions

1. Go to Firebase Console → **Build** → **Functions**
2. You should see:
   - `createStudentAuth`
   - `processPDFTimetable`
   - `cancelLecture`
   - `rescheduleLecture`
   - `sendAnnouncement`
   - `syncStudentEnrollments`

---

## 5. Frontend Setup {#frontend-setup}

### Option A: Deploy to Firebase Hosting (Recommended)

#### Step 1: Install and Configure
```bash
cd /path/to/LecScheduler
firebase init hosting
```

When prompted:
- Select your Firebase project
- Public directory: `frontend`
- Single-page app: **No**
- Overwrite index.html: **No**

#### Step 2: Deploy
```bash
firebase deploy --only hosting
```

**Output**: You'll get a URL like `https://your-project-id.web.app`

#### Step 3: Access Application
- Admin: `https://your-project-id.web.app/pages/admin.html`
- Faculty: `https://your-project-id.web.app/pages/faculty.html`
- Student: `https://your-project-id.web.app/pages/student.html`
- Login: `https://your-project-id.web.app/pages/login.html`

### Option B: Host Locally (Development Only)

```bash
# Use Python 3
python -m http.server 8000

# Or use Node.js
npx http-server frontend -p 8000
```

Then access: `http://localhost:8000/pages/login.html`

---

## 6. User Management {#user-management}

### Creating Admin Account

1. Go to Firebase Console → **Build** → **Authentication**
2. Click **"Add user"**
3. Enter:
   - Email: `admin@institution.edu`
   - Password: Generate strong password
4. Click **"Add user"**
5. Go to **Firestore** → Create document in `users` collection:

```
users/{uid}
├── role: "admin"
├── email: "admin@institution.edu"
├── name: "Admin Name"
├── semesters: ["semester-1"]
└── createdAt: timestamp
```

**Save the UID from Firebase Auth for this user.**

### Creating Faculty Account

1. Firebase Console → **Authentication** → **"Add user"**
2. Enter faculty email and password
3. Copy the UID
4. Go to **Firestore** → Create document:

```
users/{faculty-uid}
├── role: "faculty"
├── email: "faculty@institution.edu"
├── name: "Dr. Jane Smith"
├── semesters: ["semester-1"]
└── createdAt: timestamp
```

### Importing Students (From Google Form)

1. **Create Google Form** with fields:
   - Enrollment Number
   - Name
   - Phone Number

2. Set form to **collect responses in Google Sheets**

3. Copy the Spreadsheet ID from the URL

4. In admin dashboard:
   - Select semester
   - Click **"Sync Students"**
   - Paste Spreadsheet ID
   - Click **"Sync Students"**

**System will:**
- Fetch form responses
- Create Firestore student records
- Auto-generate random passwords
- Send credentials via SMS/WhatsApp mock

---

## 7. Semester & Timetable Setup {#semester-setup}

### Step 1: Create Semester

1. Login as **Admin**
2. Go to **Admin Dashboard**
3. Create a new semester in Firestore:

```
semesters/semester-1
├── name: "B.Tech - Semester 1"
├── code: "BTE-S1"
├── active: true
├── startDate: timestamp
├── endDate: timestamp (6 months later)
└── createdBy: admin-uid
```

### Step 2: Add Faculty

1. In Admin Dashboard
2. Select semester from dropdown
3. Click **"Manage Faculty"**
4. Add each faculty:
   - Name
   - Phone
   - Email

### Step 3: Upload Timetable PDF

**PDF Format Requirements:**

The PDF should contain a table with **pipe-separated** values:

```
Subject | Faculty | Day | StartTime | EndTime | Room
Mathematics | Dr. Smith | Monday | 09:00 | 10:00 | A101
Physics | Dr. Johnson | Monday | 10:00 | 11:00 | A102
Chemistry | Dr. Brown | Tuesday | 09:00 | 10:00 | B101
...
```

**How to Upload:**

1. Admin Dashboard → Select semester
2. Click **"Upload Timetable PDF"**
3. Select your PDF
4. Click **"Upload Timetable PDF"**
5. System will:
   - Extract text from PDF
   - Parse schedule
   - Check for faculty clashes
   - Auto-create lectures in Firestore
   - Notify faculty and students

---

## 8. Testing & Launch {#testing}

### Pre-Launch Checklist

- [ ] Firebase project created and configured
- [ ] Firestore security rules published
- [ ] Cloud Functions deployed
- [ ] Admin account created
- [ ] Frontend deployed or running locally
- [ ] Firebase config updated in `firebase-config.js`
- [ ] Service Worker registered
- [ ] Admin can login and access dashboard
- [ ] Faculty account created
- [ ] Faculty can login and view dashboard
- [ ] Sample semester created
- [ ] Sample timetable uploaded
- [ ] Student list imported
- [ ] Student can login and view timetable
- [ ] Notifications are displaying

### Test Scenarios

#### Admin Testing
1. Create semester
2. Add faculty
3. Upload PDF timetable
4. Send announcement
5. Archive semester

#### Faculty Testing
1. Login with email
2. View my lectures
3. Cancel a lecture
4. Reschedule a lecture
5. Send announcement

#### Student Testing
1. Receive login credentials
2. Change password on first login
3. View timetable
4. View notifications
5. Read semester chat
6. Send chat message (optional)

---

## 9. Troubleshooting {#troubleshooting}

### Firebase Issues

#### "Permission denied" error when uploading PDF
- **Solution**: Check Firestore security rules are published
- Go to **Firestore** → **Rules** → Verify content matches `firestore-rules.txt`

#### Students can't login
- **Solution**: Verify enrollment number in student list matches login
- Firebase Auth UID must equal enrollment number
- Check `users/{uid}` document exists with correct `role: "student"`

#### Cloud Functions not triggering on PDF upload
- **Solution**: Verify Storage bucket is created
- Go to **Build** → **Storage** → Check bucket exists
- Verify function logs: Firebase Console → **Functions** → Select function

### Frontend Issues

#### "Firebase config is missing" error
- **Solution**: Update `firebase-config.js` with actual config
- Get from Firebase Console → Project Settings

#### Styles not loading
- **Solution**: Check CSS file paths in HTML
- All CSS imports must use relative paths
- Verify `admin.css` is accessible from all pages

#### Service Worker not caching data
- **Solution**: Service Worker only works over HTTPS
- Firebase Hosting is HTTPS by default
- For local testing with HTTP, SW will skip caching

### Performance Issues

#### Timetable loads slowly
- **Solution**: Data is cached locally in browser
- First load fetches from Firestore
- Subsequent loads use local cache (1 hour expiry)

#### Too many Cloud Function invocations
- **Solution**: Set limits in Firebase Console
- **Firestore** → **Usage** → Set daily quota limits
- Prevents unexpected costs

---

## 10. SMS/WhatsApp Integration (Optional) {#messaging}

Currently, the system **mocks** SMS/WhatsApp credential delivery. To enable real sending:

### Using Twilio (SMS)

1. Create Twilio account: [twilio.com](https://www.twilio.com)
2. Get **Account SID** and **Auth Token**
3. Get a **Twilio phone number**
4. Update `backend/functions/index.js`:

```javascript
const twilio = require('twilio');

async function deliverCredentials(phone, enrollmentNo, password, method) {
    if (method === 'sms') {
        const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: `Your login credentials:\nEnrollment: ${enrollmentNo}\nPassword: ${password}`,
            from: TWILIO_PHONE,
            to: phone,
        });
    }
}
```

5. Add Twilio credentials to Firebase Functions secrets
6. Deploy

---

## 11. Advanced Configuration {#advanced}

### Adding More Semesters

1. Admin Dashboard
2. Manually create Firestore documents:
```
semesters/semester-2
├── name: "B.Tech - Semester 2"
├── code: "BTE-S2"
├── active: true
├── startDate: timestamp
└── endDate: timestamp
```

### Custom Email/Domain

To use custom domain instead of Firebase Hosting:

1. Deploy frontend files to your web server
2. Update `firebase-config.js` with Firebase details
3. Ensure HTTPS is enabled
4. Update Firestore CORS settings if needed

### Monitoring & Logs

1. **Cloud Functions Logs**:
   - Firebase Console → **Functions** → **Logs**

2. **Firestore Usage**:
   - Firebase Console → **Firestore** → **Usage**

3. **Storage Usage**:
   - Firebase Console → **Storage** → **Files**

---

## 12. Support & Maintenance {#support}

### Regular Tasks

- **Weekly**: Check Cloud Functions logs for errors
- **Monthly**: Review Firestore usage and optimize queries
- **End of Semester**: Archive semester (marks all data as archived)
- **Semester Start**: Create new semester, upload timetable, import students

### Backup & Recovery

Firestore has built-in backups. To manually export:

```bash
gcloud firestore export gs://your-bucket/backup-name
```

### Disaster Recovery

If data is lost:
1. Firestore → Restore from backup
2. Cloud Functions → Re-deploy
3. Firebase Storage → Re-upload timetables

---

## 13. Production Checklist {#production}

- [ ] Firebase project in **production** mode (not emulator)
- [ ] Firestore security rules reviewed and published
- [ ] Cloud Functions error handling verified
- [ ] SSL certificate enabled (Firebase Hosting default)
- [ ] Admin password is strong (20+ characters)
- [ ] Student password generation is secure
- [ ] SMS/WhatsApp credentials secure (use Cloud Secret Manager)
- [ ] Regular backups configured
- [ ] Monitoring alerts set up
- [ ] Disaster recovery plan documented
- [ ] User support contact published
- [ ] Usage limits and quotas set

---

## 📞 Support

For issues or questions:
1. Check **Troubleshooting** section above
2. Review **Firebase Console** logs
3. Contact Firebase support: [firebase.google.com/support](https://firebase.google.com/support)

---

**Happy scheduling! 📚**
