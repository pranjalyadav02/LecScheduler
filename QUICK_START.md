# 🎓 LecScheduler Quick Start

## 🚀 Getting Started (2 Minutes)

### 🔧 Step 1: Start the Development Server
In your terminal, run:
```powershell
node dev-server.js
```
Access the application at: **http://localhost:8000**

---

## 📊 Step 2: Initialize Timetable Data

The system is designed to work with your institutional PDF.

### 📥 To Load Data:
1. Go to the **Admin Portal**: http://localhost:8000/pages/admin.html
2. Login: `admin@institution.edu` / `Admin@123456`
3. Select or create a Semester.
4. Upload: `Updated_MCA_TT_Jan_May_12012026 (1).pdf`
5. Wait for the success message.
6. Click **"View Timetable"** to verify.

---

## ✅ Step 3: Portal Overview

### 🏛️ Admin Portal
- **URL:** http://localhost:8000/pages/admin.html
- **Login:** `admin@institution.edu` / `Admin@123456`
- **Actions:** Upload PDF, Manage Faculty, Send Announcements.

### 👨‍🏫 Faculty Portal
- **URL:** http://localhost:8000/pages/faculty.html
- **Login:** `dr_rajesh_verma@college.ac.in` / `Test@123478`
- **Actions:** Cancel/Reschedule Lectures, Group Chat.

### 👥 Student Portal
- **URL:** http://localhost:8000/pages/student.html
- **Login:** `MCA2026001` / `Default@1234`
- **Actions:** View Timetable, Real-time Notifications, Group Chat.

---

## 🆘 Troubleshooting

1. **Caching Issues:** If data isn't showing, press `Ctrl + Shift + R` to hard refresh.
2. **Path Errors:** Ensure you upload the specific PDF name mentioned above.
3. **Firebase:** Check the console for any initialization errors.

---

## ✨ That's it! 
The system is now running with 4 specialized portals. 🎉

