# PDF Auto-Load & Parsing Guide

## 🚀 Quick Start

Your system is now configured to automatically parse the MCA timetable PDF. Here's how to load it:

### Default PDF Location
```
C:\Users\omen\Downloads\Updated_MCA_TT_Jan_May_12012026 (1).pdf
```

---

## ✅ Fixed Issues

All the errors you were seeing have been resolved:

### 1. ✅ Firebase Deprecation Warning
**Issue:** `enableIndexedDbPersistence() will be deprecated...`
**Fix:** Updated to use new `FirestoreSettings.cache` API

### 2. ✅ common.js Syntax Error
**Issue:** `Unexpected end of input` at common.js:61
**Fix:** Removed stray backtick character

### 3. ✅ Duplicate `db` Declaration
**Issue:** `Identifier 'db' has already been declared (at admin.js:1:1)`
**Fix:** Changed destructuring to use fallback: `window.firebaseApp || {}`

### 4. ✅ Missing Modal Functions
**Issue:** `showTimetableModal is not defined`
**Fix:** Fixed script loading order with `defer` attributes

### 5. ✅ Added PDF Auto-Load Infrastructure
**Feature:** System now attempts to auto-load the default PDF on admin login

---

## 📋 Steps to Load & Parse Your PDF

### Method 1: Automatic Upload via Admin Dashboard (Recommended)

1. **Open Admin Portal**
   - Navigate to: `http://localhost:8000/pages/admin.html`
   - Login with: `admin@institution.edu` / `Admin@123456`

2. **Select Semester**
   - In the admin dashboard, select the appropriate semester from the dropdown
   - (If your semester doesn't exist, create it first)

3. **Upload the PDF**
   - Click the **"Upload Timetable PDF"** button
   - Select your PDF file: `Updated_MCA_TT_Jan_May_12012026 (1).pdf`
   - The system will automatically:
     ✓ Upload the file to Firebase Storage
     ✓ Trigger the PDF parsing function
     ✓ Extract lecture information
     ✓ Create lecture entries in Firestore

4. **Monitor Progress**
   - The status message will show "Processing... (may take a minute)"
   - Once complete, you'll see: "✓ Successfully created [X] lectures"

### Method 2: Quick Helper Script

Run the helper script to get instructions:

```bash
node load_default_pdf.js
```

This will:
- Verify your PDF exists
- Show the exact file information
- Provide step-by-step instructions

---

## 🔧 How the Auto-Parsing Works

### Behind the Scenes (Firebase Cloud Functions)

When you upload a PDF, this is what happens:

```
1. PDF uploaded to: gs://project/timetables/{semesterId}/{timestamp}_{filename}.pdf
                    ↓
2. Storage trigger activates processPDFTimetable() Cloud Function
                    ↓
3. Function downloads PDF and extracts text with pdfParse library
                    ↓
4. Text is parsed to extract:
   - Subject/Course name
   - Faculty name
   - Day of week
   - Start/End time
   - Room/Building location
                    ↓
5. System checks for scheduling conflicts
                    ↓
6. Creates lecture documents in Firestore:
   semesters/{semesterId}/lectures/{lectureId}
                    ↓
7. Marks upload as complete and updates admin dashboard
```

---

## 📊 Expected PDF Format

The system is optimized to parse timetables in these formats:

### Typical Table Layout:
```
Subject   | Faculty Name    | Day      | Time           | Room
----------|-----------------|----------|----------------|--------
Database  | Dr. Rajesh      | Monday   | 09:00 - 10:30 | A-101
Networks  | Prof. Kumar     | Tuesday  | 10:30 - 12:00 | B-205
...
```

### Variations Supported:
- ✅ PDF tables
- ✅ Formatted text with separators
- ✅ Multi-column layouts
- ✅ Different time formats (09:00, 9:00 AM, 9AM)
- ✅ Faculty names in different orders

---

## 🛠️ Customizing Semester & Faculty

Before uploading the PDF:

### 1. Create/Select Semester
- Admin Dashboard → Manage Semesters
- Enter semester name: "MCA Sem 1 (Jan-May 2026)"
- Keep the semester ID: `mca-sem1-jan2026`

### 2. Add Faculty (Optional)
- You can pre-add faculty members or let them be created from the PDF
- Admin Dashboard → Manage Faculty
- Faculty are auto-created if not found in the PDF

---

## 🔍 Troubleshooting

### PDF Not Processing?

1. **Check file format**
   - Ensure it's a valid PDF file (not corrupted)
   - Try opening in Adobe Reader first

2. **Check Firestore permissions**
   - Verify Firebase Firestore rules allow writes
   - Check function logs: Firebase Console → Functions → Logs

3. **Check parsing errors**
   - Admin Dashboard will show error messages
   - Check server logs for PDF extraction issues

### Still Seeing Old Errors?

1. **Hard refresh your browser**
   - Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

2. **Clear browser cache**
   - Open DevTools (F12) → Application → Clear Storage

3. **Check console for any remaining errors**
   - Open DevTools → Console tab
   - Look for red error messages

---

## 📈 What Happens After Parsing

Once the PDF is successfully parsed:

1. **Lectures Created** in Firestore with:
   - Subject name
   - Faculty assignment
   - Schedule (day/time)
   - Room/location
   - Status: "scheduled"

2. **Faculty Notified** via:
   - Email notification (if configured)
   - Faculty Portal automatically loads their lectures

3. **Students See Schedule** in:
   - Student Portal → My Timetable
   - Filtered by their enrolled subjects

4. **Admin Dashboard Shows**:
   - Total lectures created
   - Scheduling status
   - Any conflicts or warnings

---

## 💡 Advanced: Manual File Preparation

If the auto-parser struggles with your PDF format:

1. **Export as CSV from Excel/Spreadsheet**
   - Better extraction accuracy
   - Can upload and parse

2. **Normalize the PDF**
   - Remove header/footer images
   - Ensure clean table structure
   - Remove watermarks

3. **Use extract_pdf.py Script**
   ```bash
   python extract_pdf.py "C:\Users\omen\Downloads\Updated_MCA_TT_Jan_May_12012026 (1).pdf"
   ```
   - Saves extracted text to `pdf_text.txt`
   - Review extraction quality
   - Can manually adjust if needed

---

## 📞 Getting Help

If you run into issues:

1. **Check the logs**
   - Browser console (F12)
   - Firebase Cloud Functions logs
   - Check `parse_output.txt` for parsing details

2. **Review error messages** shown in admin dashboard
   - They indicate what went wrong and suggestions

3. **Check file** at `C:\Users\omen\Downloads\`
   - Verify the exact filename matches

---

## 🎯 Next Steps

After successfully parsing the PDF:

1. **Faculty Portal**
   - Faculty login to see their assigned lectures
   - Update lecture details as needed

2. **Student Enrollment**
   - Students self-enroll or are bulk-enrolled
   - They see their personalized timetables

3. **Track Announcements**
   - Faculty can send announcements to their classes
   - Students receive real-time notifications

---

**System Status:** ✅ Ready for PDF parsing
**Default PDF:** ✅ Ready to load
**Backend:** ✅ Cloud Functions active

Happy scheduling! 📚
