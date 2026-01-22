# Simplified Firestore Schema (Low-Infrastructure Design)

## Collections

### 1. `semesters`
```
semester-1 (doc)
├── name: string (e.g., "B.Tech - Semester 1")
├── code: string (e.g., "BTE-S1")
├── active: boolean
├── startDate: timestamp
├── endDate: timestamp
├── archiveChatAt: timestamp (auto-calculated)
└── createdBy: string (admin UID)
```

### 2. `semester/{semesterId}/students`
```
enrollment123 (doc)
├── enrollmentNo: string
├── name: string
├── phone: string
├── email: string (optional)
├── passwordChanged: boolean (false on first login)
├── status: string ("active", "inactive", "archived")
└── createdAt: timestamp
```

### 3. `semester/{semesterId}/faculty`
```
faculty001 (doc)
├── name: string
├── phone: string
├── email: string
├── initials: string (for timetable parsing)
├── subjects: array (["Subject1", "Subject2"])
└── status: string ("active", "inactive")
```

### 4. `semester/{semesterId}/lectures`
```
lecture-UUID (doc)
├── subject: string
├── faculty: string (faculty name)
├── day: string ("Monday", "Tuesday", ...)
├── startTime: string ("09:00")
├── endTime: string ("10:00")
├── room: string ("A101")
├── semester: string (semester ID)
├── status: string ("scheduled", "cancelled", "rescheduled")
├── originalTime: string (if rescheduled)
├── cancelReason: string
├── isCombined: boolean
├── combinedWith: array (other lecture IDs)
├── createdFrom: string ("pdf-upload", "manual")
├── createdAt: timestamp
└── lastModified: timestamp
```

### 5. `semester/{semesterId}/notifications`
```
notification-UUID (doc)
├── type: string ("lecture-cancelled", "lecture-rescheduled", "announcement")
├── title: string
├── message: string
├── semester: string
├── affectedLectures: array (lecture IDs)
├── sentBy: string (faculty/admin name)
├── sentAt: timestamp
├── status: string ("sent", "pending")
└── readBy: array (student UIDs who read)
```

### 6. `semester/{semesterId}/chat`
```
messages (subcollection)
├── message-UUID (doc)
│   ├── sender: string (user UID)
│   ├── senderName: string
│   ├── senderRole: string ("student", "faculty", "admin")
│   ├── message: string
│   ├── timestamp: timestamp
│   └── isArchived: boolean (marked when semester ends)
```

### 7. `pdf_uploads` (Admin tracking only)
```
upload-UUID (doc)
├── semesterId: string
├── uploadedAt: timestamp
├── uploadedBy: string (admin UID)
├── fileName: string
├── storagePath: string (Firebase Storage path)
├── status: string ("processing", "success", "failed")
├── clashesFound: boolean
├── clashDetails: array (if any)
├── lecturesCreated: number
└── errorLog: string (if failed)
```

### 8. `admin_settings` (Global configuration - minimal)
```
config (single doc)
├── appName: string
├── institution: string
├── supportPhone: string
├── supportEmail: string
├── maxStudentsPerSemester: number
├── credentialDeliveryMethod: string ("sms", "whatsapp")
├── pdfTimetableTemplate: string (format description)
└── maintenanceMode: boolean
```

---

## Key Design Principles

1. **Semester-Scoped Data**: All student, faculty, lecture data is nested under `semester/{semesterId}/` to prevent cross-semester data leakage.

2. **No Configuration Collection**: Users don't configure anything. Admin just uploads PDF and everything else is automated.

3. **Minimal Fields**: Only essential fields to reduce complexity and storage.

4. **No Real-Time Sync Pressure**: Data is read at login and cached locally. No continuous real-time subscriptions for students.

5. **Archiving, Not Deletion**: Lectures and chats are marked `archived: true` instead of deleted, preserving audit trail.

6. **Single Role per User**: Simplifies permission logic. If a user is faculty, they're faculty for all semesters they're assigned to.

---

## Migration Strategy (Semester Rollover)

When a new semester starts:
1. Previous semester lectures → mark `archived: true`
2. Previous semester students → mark `status: "archived"`
3. Previous semester chat → mark `isArchived: true`
4. Faculty list → admin updates
5. New student list → upload new CSV/Google Form
6. New semester → created with `active: true`
