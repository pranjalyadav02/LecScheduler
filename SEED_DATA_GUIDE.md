# 🎓 AUTO-SEED TIMETABLE DATA - COMPLETE GUIDE

## Overview

Your system now has **3 ways** to automatically create default timetable data:

1. **📱 Web UI (Easiest)** - Click a button to seed data
2. **🔧 Node.js Script** - Parse PDF and seed automatically
3. **💻 Manual Firestore** - Create data directly in console

---

## ⚡ QUICKEST METHOD: Web UI Seeding (Recommended)

### Step 1: Start the Seeding Server
```bash
cd C:\Users\omen\LecScheduler
node seed_data_via_api.js
```

You should see:
```
🚀 Timetable Seeding Server Started!
📍 Open in browser: http://localhost:8001
```

### Step 2: Open in Browser
1. Open your browser
2. Go to: **http://localhost:8001**
3. You'll see a nice UI with all the data to be created

### Step 3: Click "Create Default Timetable Data"
- Wait for success message
- It will automatically create:
  - ✅ 1 Semester (MCA Sem 1, Jan-May 2026)
  - ✅ 10 Lectures (with times, faculties, rooms)
  - ✅ 6 Faculty members
  - ✅ 5 Sample students

### Step 4: Refresh Admin Portal
1. Go to: **http://localhost:8000/pages/admin.html**
2. Press **Ctrl+Shift+R** (hard refresh)
3. Login with: `admin@institution.edu` / `Admin@123456`
4. Select the semester from dropdown → See all lectures!

---

## 🔧 ADVANCED METHOD: Node.js PDF Parsing

This method reads your PDF and extracts lecture data automatically.

### Requirements:
- Firebase service account key (optional, has fallback)

### Step 1: Run the Script
```bash
cd C:\Users\omen\LecScheduler
npm install pdf-parse firebase-admin
node seed_timetable_from_pdf.js
```

### What It Does:
1. Reads your PDF: `C:\Users\omen\Downloads\Updated_MCA_TT_Jan_May_12012026 (1).pdf`
2. Extracts lecture information using AI/parsing
3. Creates Firestore documents
4. Sets up test data automatically

### If PDF Parsing Fails:
The script automatically falls back to default lectures:
- 10 sample MCA lectures
- Realistic times and rooms
- Professional faculty assignments

---

## 📊 Data That Gets Created

### Semester:
```
🎓 MCA Semester 1 (Jan-May 2026)
📅 Starts: January 15, 2026
📅 Ends: May 30, 2026
```

### Lectures (10 Total):
```
Monday:
  • 09:00-10:30 | Object Oriented Programming | Dr. Rajesh Verma | A-101
  • 11:00-12:30 | Database Management | Prof. Kumar Singh | B-205

Tuesday:
  • 09:00-10:30 | Web Development | Dr. Sharma Patel | C-301
  • 11:00-12:30 | Advanced Java | Prof. Gupta | A-102

Wednesday:
  • 09:00-10:30 | Data Structures | Dr. Mishra | B-206
  • 11:00-12:30 | Network Security | Prof. Rao | C-302

Thursday:
  • 09:00-10:30 | Cloud Computing | Dr. Rajesh Verma | A-103
  • 11:00-12:30 | Mobile App Development | Prof. Kumar Singh | B-207

Friday:
  • 09:00-10:30 | AI & Machine Learning | Dr. Sharma Patel | C-303
  • 11:00-12:30 | Software Engineering | Prof. Gupta | A-104
```

### Faculty (6 Members):
```
1. Dr. Rajesh Verma (dr_rajesh_verma@college.ac.in)
2. Prof. Kumar Singh (kumar.singh@college.ac.in)
3. Dr. Sharma Patel (sharma.patel@college.ac.in)
4. Prof. Gupta (gupta@college.ac.in)
5. Dr. Mishra (mishra@college.ac.in)
6. Prof. Rao (rao@college.ac.in)
```

### Test Students (5):
```
1. MCA2026001 - Priya Sharma
2. MCA2026002 - Arun Kumar
3. MCA2026003 - Deepika Singh
4. MCA2026004 - Rohit Patel
5. MCA2026005 - Nisha Gupta
```

---

## 🧪 Testing After Seeding

### 1. Check Admin Portal
```
URL: http://localhost:8000/pages/admin.html
Login: admin@institution.edu / Admin@123456

Actions:
✓ Select semester "MCA Semester 1 (Jan-May 2026)"
✓ Click "View Timetable" → Should show 10 lectures
✓ Click "Manage Faculty" → Should show 6 faculty
✓ Check lecture status counts
```

### 2. Check Student Portal
```
URL: http://localhost:8000/pages/student.html
Login: MCA2026001 / Default@1234

You should see:
✓ Student name "Priya Sharma"
✓ Current semester
✓ All lectures in the timetable
```

### 3. Check Faculty Portal
```
URL: http://localhost:8000/pages/faculty.html
Login: dr_rajesh_verma@college.ac.in / Test@123478

You should see:
✓ Faculty name "Dr. Rajesh Verma"
✓ Assigned lectures (OOP and Cloud Computing)
✓ Student enrollment for each lecture
```

---

## 🔍 Troubleshooting

### Problem: Still Seeing Old Errors
**Solution:** Clear browser cache
1. Press `F12` to open DevTools
2. Go to `Application` tab
3. Click `Clear Storage`
4. Refresh the page with `Ctrl+Shift+R`

### Problem: "Firebase not initialized"
**Solution:** Wait 2-3 seconds after page loads
- The seed page automatically waits for Firebase
- If still failing, check browser console for errors

### Problem: "Permission denied" when seeding
**Solution:** Check Firestore Rules
1. Go to Firebase Console
2. Firestore → Rules
3. Ensure rules allow admin writes:
   ```
   match /databases/{database}/documents {
     match /{document=**} {
       allow read, write: if request.auth != null;
     }
   }
   ```

### Problem: PDF Parsing Returning No Data
**Solution:** Uses fallback lectures
- The script has built-in fallback to default lectures
- Your PDF data might be in different format
- The default ~10 lectures still work perfectly

---

## 📋 Script Files Created

| File | Purpose | How to Run |
|------|---------|-----------|
| `seed_data_via_api.js` | Easy web UI seeding | `node seed_data_via_api.js` |
| `seed_timetable_from_pdf.js` | Parse PDF and seed | `node seed_timetable_from_pdf.js` |
| `seedDataAdmin.js` | Helper functions | (auto-loaded, has `seedTestData()`) |

---

## 💡 Quick Reference

### To Seed Data (Pick ONE):
```bash
# Option 1: Easy Web UI (RECOMMENDED)
node seed_data_via_api.js
# Then open: http://localhost:8001

# Option 2: PDF Parsing
node seed_timetable_from_pdf.js

# Option 3: Browser Console (Manual)
# Open Admin Portal, press F12, in Console type:
# await seedTestData()
```

### To Verify Data Created:
```bash
# Check Firebase Console directly
# Go to: https://console.firebase.google.com
# Select project: lecscheduler-4e36b
# Firestore Database → collections → semesters → mca-sem1-jan2026
```

### Default Credentials:
```
Admin:   admin@institution.edu / Admin@123456
Faculty: dr_rajesh_verma@college.ac.in / Test@123478
Student: MCA2026001 / Default@1234
```

---

## 🎯 Next Actions

1. ✅ **Clear browser cache** (Ctrl+Shift+R on all portals)
2. ✅ **Seed the data** (use web UI method)
3. ✅ **Test each portal** (admin, faculty, student)
4. ✅ **Verify timetables display** correctly
5. ✅ **Check no console errors** (F12 → Console)

---

## 📞 If Something Goes Wrong

**Check these in order:**

1. **Browser Console (F12)** - Look for red error messages
2. **Firebase Console** - Check Firestore has data
3. **Network Tab** - See if API calls are succeeding
4. **Try clearing cache** - `Storage → Clear Site Data`
5. **Restart servers** - Kill and restart node processes

---

**Status:** ✅ All errors fixed, data seeding ready!
**Next Step:** Run `node seed_data_via_api.js` and open http://localhost:8001
