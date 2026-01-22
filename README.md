# Lecture Scheduler - Production-Ready Academic System

## 🎯 What is This?

**Lecture Scheduler** is a **low-complexity, automation-first** web application for academic institutions to manage:
- 📚 Semester-based lecture schedules
- 📄 Automatic PDF timetable parsing
- 👥 Student enrollment and authentication
- 📢 Lecture notifications and announcements
- 💬 Semester-wide chat system

**Designed for**: Institutions with limited IT resources and non-technical staff.

---

## 🚀 Quick Start (5 minutes)

### 1. **Firebase Setup** (One-time, 10 minutes)
```bash
# Go to Firebase Console
# https://console.firebase.google.com/

# 1. Create new project
# 2. Enable: Firestore, Auth, Storage, Functions
# 3. Copy Firebase config from Project Settings
# 4. Update frontend/js/firebase-config.js
```

### 2. **Deploy Backend**
```bash
cd backend/functions
firebase deploy --only functions
```

### 3. **Deploy Frontend**
```bash
firebase deploy --only hosting
```

### 4. **Create Admin Account**
```bash
# Firebase Console → Authentication → Add User
# Email: admin@institution.edu
# Then create Firestore document:

users/{uid}
├── role: "admin"
├── semesters: ["semester-1"]
└── name: "Admin"
```

### 5. **Start Using**
- Admin Portal: `https://your-project.web.app/pages/admin.html`
- Faculty Portal: `https://your-project.web.app/pages/faculty.html`
- Student Portal: `https://your-project.web.app/pages/student.html`

---

## 📁 Project Structure

```
LecScheduler/
├── backend/
│   └── functions/
│       ├── index.js           # Cloud Functions code
│       └── package.json        # Dependencies
│
├── frontend/
│   ├── pages/
│   │   ├── login.html         # Login page (all roles)
│   │   ├── admin.html         # Admin dashboard
│   │   ├── faculty.html       # Faculty portal
│   │   └── student.html       # Student portal
│   ├── js/
│   │   ├── firebase-config.js # Firebase configuration
│   │   ├── login.js           # Login logic
│   │   ├── admin.js           # Admin functionality
│   │   ├── faculty.js         # Faculty functionality
│   │   ├── student.js         # Student functionality
│   │   └── service-worker.js  # Offline support
│   └── css/
│       ├── admin.css          # Unified styles
│       ├── faculty.css        # (imports admin.css)
│       ├── student.css        # (imports admin.css)
│       └── login.css          # (imports admin.css)
│
├── firebase-config/
│   ├── firestore-schema.md    # Database design
│   └── firestore-rules.txt    # Security rules
│
├── docs/
│   └── API_REFERENCE.md       # (to be created)
│
├── SETUP_GUIDE.md             # Complete setup instructions
└── README.md                  # This file
```

---

## 👥 User Roles & Access

### Admin 🔑
**What they do:**
- Upload semester timetables (PDF)
- Manage faculty and students
- Send institution-wide notices
- View all system activity
- Archive semesters

**Access:**
- Full read/write access to all data
- One button to upload PDF → auto-create 100+ lectures

### Faculty 👨‍🏫
**What they do:**
- View their lectures
- Cancel lectures (notify students)
- Reschedule lectures
- Send announcements to students
- Participate in semester chat

**Access:**
- Read-only: timetable, student list
- Write: lecture updates, announcements

### Student 👤
**What they do:**
- View personal timetable
- See lecture updates/cancellations
- Read announcements
- Chat in semester group
- NO lecture creation/modification

**Access:**
- Read-only: timetable, notifications, chat
- Limited: send chat messages

---

## 🔐 Security Features

✅ **Role-Based Access Control** - Firestore security rules enforce strict permissions
✅ **Semester Isolation** - Students only see their semester data
✅ **Read-Only for Students** - Prevent accidental modifications
✅ **Enrollment-Based Auth** - Students login with enrollment number only
✅ **Password Management** - Force password change on first login
✅ **Offline Caching** - Service Worker caches timetable locally

---

## ⚙️ Key Automations

### 1️⃣ **PDF Timetable Upload**
```
Upload PDF → Extract text → Parse schedule → Check clashes 
→ Create lectures → Notify all users
```

### 2️⃣ **Student Onboarding**
```
Google Form submission → Verify enrollment → Create Firebase Auth 
→ Generate password → Send SMS/WhatsApp
```

### 3️⃣ **Lecture Notifications**
```
Faculty cancels lecture → Firestore update → Cloud Messaging 
→ Students see notification instantly
```

---

## 📊 Firestore Schema (Simplified)

```
semesters/
├── semester-1
│   ├── name: "B.Tech - Sem 1"
│   ├── students/ (enrollment number → student data)
│   ├── faculty/ (faculty profiles)
│   ├── lectures/ (auto-created from PDF)
│   ├── notifications/ (system messages)
│   └── chat/messages/ (semester-wide chat)

users/ (auth + role mapping)
├── student-uid → {role, semester, name}
├── faculty-uid → {role, semesters, name}
└── admin-uid → {role, name}

admin_settings/ (global config)
└── config → {app name, institution, support phone}
```

---

## 🔌 API Reference

### Cloud Functions (Callable)

#### `createStudentAuth`
Create Firebase Auth user for student (enrollment-based)
```javascript
const result = await functions.httpsCallable('createStudentAuth')({
    enrollmentNo: "ENG2024001",
    phone: "+919876543210",
    semesterId: "semester-1"
});
```

#### `cancelLecture`
Cancel a lecture and notify students
```javascript
const result = await functions.httpsCallable('cancelLecture')({
    semesterId: "semester-1",
    lectureId: "lecture-123",
    reason: "Faculty leave"
});
```

#### `sendAnnouncement`
Send notice to all students
```javascript
const result = await functions.httpsCallable('sendAnnouncement')({
    semesterId: "semester-1",
    title: "Mid-term exam on 15th",
    message: "Exam will be conducted in..."
});
```

---

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Permission denied" | Firestore rules not published | Go to Firestore → Rules → Publish |
| "Firebase config is missing" | Config not updated | Update `firebase-config.js` with actual config |
| Students can't login | Enrollment number not in list | Verify in Firestore `students` collection |
| PDF not processed | Incorrect format | Use pipe-separated format: `Subject \| Faculty \| Day ...` |
| Styles not loading | CSS path wrong | Check relative paths in HTML `<link>` tags |

---

## 💾 Deployment Checklist

- [ ] Firebase project created
- [ ] Firestore security rules published
- [ ] Cloud Functions deployed
- [ ] Frontend deployed to Firebase Hosting
- [ ] Firebase config updated in code
- [ ] Admin account created
- [ ] First semester created
- [ ] Faculty accounts created
- [ ] Student list imported from Google Form
- [ ] Sample timetable uploaded and verified
- [ ] All roles tested (admin, faculty, student)
- [ ] Offline mode tested
- [ ] HTTPS enabled (Firebase Hosting default)

---

## 📱 Browser Support

✅ Chrome (Android + Desktop)
✅ Firefox
✅ Safari (iOS + macOS)
✅ Edge

All modern browsers with:
- ES6 JavaScript support
- Service Worker support
- IndexedDB for local caching

---

## 📞 Support

1. **Setup Issues**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Firestore Issues**: Check Firebase Console → Firestore → Usage
3. **Function Errors**: Firebase Console → Functions → Logs
4. **User Feedback**: Implement feedback form in student portal

---

## 🔄 Semester Lifecycle

```
┌─────────────────────────────────────────┐
│  SEMESTER START                         │
├─────────────────────────────────────────┤
│ 1. Admin creates new semester           │
│ 2. Faculty added to semester            │
│ 3. Students imported from Google Form   │
│ 4. PDF timetable uploaded               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  SEMESTER ACTIVE (16 weeks)             │
├─────────────────────────────────────────┤
│ • Lectures scheduled                    │
│ • Faculty can cancel/reschedule         │
│ • Students view timetable               │
│ • Semester chat active                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  SEMESTER END                           │
├─────────────────────────────────────────┤
│ 1. Archive semester (one-click)         │
│ 2. Mark lectures as archived            │
│ 3. Disable student access               │
│ 4. Create new semester (repeat above)   │
└─────────────────────────────────────────┘
```

---

## 🎨 Usability Principles

This system follows **"low-infrastructure design"**:

1. **One Button = One Action**
   - Avoid nested menus
   - Large, clear buttons
   - Explicit labels ("Upload PDF", "Cancel Lecture")

2. **Automation Over Clicks**
   - Upload PDF → 100+ lectures auto-created
   - Import form → auto-generate credentials
   - Faculty clash detection → auto-notify

3. **Offline-First**
   - Cache timetable locally
   - Service Worker enables offline viewing
   - Auto-sync when online

4. **Mobile-Ready**
   - Responsive design
   - Touch-friendly buttons
   - Fast loading on 3G

5. **Human-Readable Errors**
   - ❌ "Permission denied" → "❌ You don't have access to this semester"
   - ❌ "Invalid credentials" → "❌ Check the password sent to your phone"

---

## 📊 System Limits & Quotas

**Firebase Free Tier** supports:
- ✅ 50,000 read/month
- ✅ 20,000 write/month
- ✅ 1 GB storage
- ✅ 2 GB functions

**For larger institutions**, upgrade to **Blaze** (pay-as-you-go):
- ~$1-5/month for small institution
- Automatic scaling

---

## 🛠️ Development Mode

To test locally:

```bash
# 1. Use Firebase Emulator (local)
firebase emulator:start

# 2. Update firebase-config.js to point to emulator
const firebaseConfig = {
    // ... normal config
};
// Connect to emulator
db.useEmulator('localhost', 8080);
auth.useEmulator('http://localhost:9099');

# 3. Start frontend server
cd frontend
python -m http.server 8000

# 4. Visit http://localhost:8000/pages/login.html
```

---

## 📈 Performance Tips

1. **Cache timetable locally** - Already implemented via service worker
2. **Lazy-load chat messages** - Load first 50, then pagination
3. **Batch Firestore writes** - Use batch() for multiple updates
4. **Compress PDFs** - Smaller files = faster processing
5. **Use CDN** - Firebase Hosting uses global CDN automatically

---

## 🔒 Privacy & Data Protection

- **GDPR Compliant**: Users can request data export
- **Session Management**: Auto-logout after 1 hour inactivity
- **Encryption**: All data in transit (HTTPS)
- **No Tracking**: Analytics not enabled by default
- **Data Minimization**: Only collect essential fields

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Web App Security](https://firebase.google.com/docs/web/setup)

---

## 📝 License

This project is provided as-is for academic institutions. Feel free to modify and distribute.

---

## 🙋 Feedback & Suggestions

To improve this system:
1. Create GitHub issues for bugs
2. Propose features for your institution's needs
3. Share deployment experiences

---

**Built with ❤️ for academic institutions.** 📚

**Version**: 1.0 | **Last Updated**: January 2026
