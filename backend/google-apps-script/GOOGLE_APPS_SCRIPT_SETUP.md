# Google Apps Script Deployment Guide

## Overview
This guide explains how to replace Firebase Cloud Functions with free **Google Apps Script** to keep your LecScheduler project completely free.

**Why Google Apps Script?**
- ✅ Completely free (no Blaze plan required)
- ✅ Integrates with Google Forms and Google Sheets
- ✅ Scheduled triggers for automation
- ✅ Email notifications built-in
- ✅ Easy debugging and logging

---

## Part 1: PDF Timetable Processing

### What It Does
- Monitors Google Drive for new PDF files
- Extracts text from PDFs
- Parses timetable data
- Detects faculty schedule clashes
- Auto-creates lectures in Firestore

### Setup Steps

#### Step 1: Get Firebase API Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **lecscheduler-4e36b** project
3. Click **Settings** ⚙️ → **Project Settings**
4. Go to **"Service Accounts"** tab
5. Click **"Generate New Private Key"** → Save JSON file
6. Copy the `private_key` value (long string starting with `-----BEGIN`)
7. Also note the `project_id`

#### Step 2: Create Google Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click **"+ New Project"**
3. Name it: `LecScheduler-PDF-Processor`
4. Paste the code from `processPDFTimetable.gs` into the editor
5. Delete the default code first

#### Step 3: Set Environment Variables
1. In Google Apps Script editor, click **Project Settings** (gear icon)
2. Click **"Script properties"**
3. Add these properties:
   ```
   Property Name: FIREBASE_API_KEY
   Value: [Your Firebase API Key from Step 1]
   ```
   ```
   Property Name: FIREBASE_PROJECT_ID
   Value: lecscheduler-4e36b
   ```
   ```
   Property Name: TIMETABLE_FOLDER_ID
   Value: [See Step 6 below for how to get this]
   ```

#### Step 4: Deploy as Web App
1. Click **Deploy** → **New Deployment**
2. Select type: **"Web app"**
3. Settings:
   - Execute as: *Your email*
   - Who has access: *Anyone*
4. Click **Deploy**
5. Copy the deployment URL (looks like: `https://script.google.com/macros/d/...`)

#### Step 5: Set Up Time-Based Trigger
1. In editor, click **Triggers** (clock icon)
2. Click **"+ Create trigger"**
3. Settings:
   - Function: `checkForNewPDFs`
   - Event type: **Time-driven**
   - Frequency: **Hour timer** (every hour)
   - Time of day: (your choice)
4. Save

#### Step 6: Create Google Drive Folder and Get Folder ID
**This determines where PDFs are stored - it can be anywhere in your Drive**

1. Open [Google Drive](https://drive.google.com)
2. Create a new folder: `LecScheduler-Timetables` (or any name you prefer)
3. **Get the Folder ID:**
   - Right-click the folder → **Share**
   - Look at the URL in the address bar
   - It looks like: `https://drive.google.com/drive/folders/**FOLDER_ID_HERE**`
   - Copy the long ID after `/folders/`
4. Go back to Google Apps Script editor
5. Click **Project Settings** → **Script properties**
6. Update the `TIMETABLE_FOLDER_ID` property with your folder ID
7. Save

**To change the folder later:** Just update the `TIMETABLE_FOLDER_ID` in Script properties - no code changes needed.

#### Step 7: Store PDF in Drive
1. Place your timetable PDF in the folder you created above
2. Name it: `{semesterId}_timetable.pdf`
   - Example: `sem-2024-s1_timetable.pdf`
3. The script will automatically detect and process it hourly

#### Step 8: Test
1. In Google Apps Script editor, click **Run** next to `checkForNewPDFs`
2. Check the **Execution log** (View → Execution log)
3. Go to Firebase Console → Firestore → `semesters/{semesterId}/lectures`
4. You should see new lectures created!

---

## Part 2: Student Enrollment from Google Form

### What It Does
- Google Form for student registration
- Auto-syncs responses to Firestore
- Sends confirmation emails
- Creates student records in Firestore

### Setup Steps

#### Step 1: Create Google Form
1. Go to [forms.google.com](https://forms.google.com)
2. Click **"+ Create new form"**
3. Name: `Student Registration - {SemesterId}`
4. Add questions (in this order):
   - **Name** (Short answer)
   - **Enrollment Number** (Short answer)
   - **Phone Number** (Short answer)
5. Click **Send** → Copy the form link to share with students

#### Step 2: Create Google Apps Script Project (Linked to Form)
1. Open your Google Form
2. Click **⋮** (three dots) → **"Go to linked Apps Script"**
3. If no Apps Script is linked:
   - Click **Tools** → **Script editor**
4. Name it: `LecScheduler-Enrollment-Sync`
5. Paste code from `syncStudentEnrollments.gs`

#### Step 3: Set Environment Variables
1. Click **Project Settings** (gear icon)
2. Add properties:
   ```
   Property Name: FIREBASE_API_KEY
   Value: [Your Firebase API Key]
   ```
   ```
   Property Name: FIREBASE_PROJECT_ID
   Value: lecscheduler-4e36b
   ```
   ```
   Property Name: SEMESTER_ID
   Value: [Your semester ID, e.g., sem-2024-s1]
   ```

#### Step 4: Set Up Form Submit Trigger
1. Click **Triggers** (clock icon)
2. Click **"+ Create trigger"**
3. Settings:
   - Function: `onFormSubmit`
   - Event type: **"From form"**
   - Event: **On form submit**
4. Save trigger

#### Step 5: Deploy as Web App
1. Click **Deploy** → **New Deployment**
2. Select type: **"Web app"**
3. Settings:
   - Execute as: *Your email*
   - Who has access: *Anyone*
4. Deploy and copy URL

#### Step 6: Test
1. Open your Google Form
2. Submit a test response:
   - Name: `Test Student`
   - Enrollment: `test123`
   - Phone: `+91-9876543210`
3. Check **Execution log** to verify
4. Go to Firebase Console → Firestore → `semesters/{semesterId}/students/test123`
5. You should see the student record created!

#### Step 7: Share Form with Students
- Share the form link with students
- Responses automatically sync to Firestore
- No manual data entry needed!

---

## Part 3: Alternative - Upload CSV via Google Sheets

If students prefer uploading a CSV instead of a form:

#### Step 1: Create Google Sheet
1. Create new Google Sheet
2. Add columns: `Enrollment Number`, `Name`, `Phone`
3. Paste all student data
4. Copy the Sheet ID from URL

#### Step 2: Call Sync Function
In Google Apps Script, call:
```javascript
const result = syncFromGoogleSheets("sem-2024-s1", "YOUR_SHEET_ID", "Sheet1!A2:C");
Logger.log(result);
```

---

## Part 4: Limitations & Workarounds

| Feature | Cloud Functions | Google Apps Script | Workaround |
|---------|-----------------|-------------------|-----------|
| PDF text extraction | ✅ Full | ⚠️ Limited | Use external service (ilovepdf.com API) |
| Google Forms integration | ❌ No | ✅ Yes | Use GAS native integration |
| Scheduled tasks | ✅ Yes | ✅ Yes | Time-based triggers |
| Email notifications | ✅ Yes | ✅ Yes | MailApp built-in |
| Realtime triggers | ✅ Yes | ✅ Yes | Form submit trigger |
| Cost | ❌ Blaze $15+/month | ✅ Free | GAS is better! |

---

## Part 5: What About Other Cloud Functions?

The original backend had 6 Cloud Functions. Here's what to do with each:

### ✅ Already Converted to GAS
1. **processPDFTimetable** → `processPDFTimetable.gs`
2. **syncStudentEnrollments** → `syncStudentEnrollments.gs`

### ⚠️ Hybrid (GAS + Firestore Rules)
3. **cancelLecture** → Frontend calls Firestore directly (security rules protect it)
4. **rescheduleLecture** → Frontend calls Firestore directly
5. **sendAnnouncement** → Frontend calls Firestore directly

### ✅ Already in Frontend
6. **createStudentAuth** → Built into `student.js` login flow

---

## Part 6: Firestore Security Rules

Make sure your Firestore security rules are set correctly:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    function isFaculty() {
      return getUserRole() == 'faculty';
    }

    function isStudent() {
      return getUserRole() == 'student';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAdmin() || request.auth.uid == userId;
      allow create, update: if isAdmin();
    }

    // Semesters collection
    match /semesters/{semesterId} {
      allow read: if request.auth != null;
      allow create, update, delete: if isAdmin();

      // Lectures subcollection
      match /lectures/{lectureId} {
        allow read: if request.auth != null;
        allow create, update: if isFaculty() || isAdmin();
        allow delete: if isAdmin();
      }

      // Students subcollection
      match /students/{studentId} {
        allow read: if request.auth != null;
        allow create, update: if isAdmin();
      }

      // Notifications
      match /notifications/{notificationId} {
        allow read: if request.auth != null;
        allow create: if isFaculty() || isAdmin();
      }

      // Chat
      match /chat/messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow delete: if isAdmin() || request.auth.uid == resource.data.senderId;
      }
    }

    // PDF uploads logging
    match /pdf_uploads/{uploadId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## Part 7: Troubleshooting

### PDF extraction not working
- Google Apps Script has limited PDF support
- **Solution**: Use external API
  - ilovepdf.com (free tier)
  - OCR.space (free tier)
  - Modify the `extractTextFromPDF()` function to call their API

### Google Sheets API errors
- Need to enable Google Sheets API in GAS
- **Solution**: In GAS editor, click **Libraries** → Search `Sheets` → Add latest version

### Timezone issues
- Make sure GAS project timezone matches your institution
- **Settings** → General → Timezone

### Can't deploy as web app
- Make sure you're logged in with correct Google account
- Try deleting old deployments first

---

## Part 8: Manual Actions Required

Since we removed Blaze functions, admins now do these manually via the frontend:

✅ Create/edit semesters (admin)
✅ Add faculty members (admin)
✅ Create lectures (via PDF auto-sync OR manual entry)
✅ Cancel/reschedule lectures (faculty)
✅ Send announcements (faculty/admin)
✅ Create student accounts (via enrollment sync OR manual)

---

## Summary

**Cost: $0** 🎉
- ✅ Firebase Hosting (free tier)
- ✅ Firestore (1GB free, 50k reads/day)
- ✅ Google Apps Script (free)
- ✅ Google Forms (free)
- ✅ Google Sheets (free)

**Deployment Steps:**
1. Create GAS projects for PDF and enrollment sync
2. Deploy both as web apps
3. Set up time-based and form submit triggers
4. Publish Firestore security rules
5. Create Google Form for student registration
6. Share form link with students
7. Done! Everything auto-syncs to Firestore

Questions? Check the execution logs in Google Apps Script for debugging.
