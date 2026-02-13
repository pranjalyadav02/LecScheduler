const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

// ============================================================================
// 1. SIMPLIFIED AUTHENTICATION: Create student with enrollment number only
// ============================================================================

exports.createStudentAuth = functions.https.onCall(async (data, context) => {
  try {
    const { enrollmentNo, phone, semesterId } = data;

    if (!enrollmentNo || !phone || !semesterId) {
      throw new Error('Enrollment number, phone, and semester are required.');
    }

    // Verify enrollment number against semester student list
    const studentRef = db.collection('semesters').doc(semesterId)
      .collection('students').doc(enrollmentNo);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      throw new Error(
        'Enrollment number not found in this semester. Please verify with your institution.'
      );
    }

    // Generate random password (8 characters: mixed case + numbers)
    const password = Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 3).toUpperCase();

    // Create Firebase Auth user with enrollment number as UID
    const userRecord = await auth.createUser({
      uid: enrollmentNo,
      email: `${enrollmentNo}@lec-scheduler.local`,
      password: password,
      displayName: studentDoc.data().name,
      disabled: false,
    });

    // Update student record with auth status
    await studentRef.update({
      authCreated: true,
      passwordChanged: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send credentials via SMS or WhatsApp (mock for now)
    await deliverCredentials(phone, enrollmentNo, password, semesterId, 'sms');

    return {
      success: true,
      message: `Login credentials sent to ${phone}. Check SMS for your temporary password.`,
      uid: enrollmentNo,
    };
  } catch (error) {
    console.error('Error creating student auth:', error);
    return {
      success: false,
      message: error.message || 'Could not create account. Please contact support.',
    };
  }
});

// ============================================================================
// 2. AUTOMATION: PDF Upload → Auto-Create Lectures
// ============================================================================

exports.processPDFTimetable = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;

    // Only process files in the "timetables/" folder
    if (!filePath.startsWith('timetables/')) {
      return;
    }

    const semesterId = filePath.split('/')[1]; // timetables/{semesterId}/file.pdf

    try {
      // Download PDF from Storage
      const file = storage.bucket().file(filePath);
      const [buffer] = await file.download();

      // Extract text from PDF
      const pdfData = await pdfParse(buffer);
      const extractedText = pdfData.text;

      // Parse timetable (simplified: expects CSV-like format)
      const lectures = parseTimetableText(extractedText, semesterId);

      // Check for faculty time clashes
      const clashes = await detectClashes(lectures, semesterId);

      if (clashes.length > 0) {
        // Notify admin about clashes
        await notifyAdmin(semesterId, 'Timetable has scheduling conflicts', clashes);

        // Don't create lectures if clashes found
        await db.collection('pdf_uploads').add({
          semesterId,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'failed',
          clashesFound: true,
          clashDetails: clashes,
          errorLog: 'Faculty time clashes detected. Please resolve and re-upload.',
        });
        return;
      }

      // Auto-create lectures in Firestore
      let createdCount = 0;
      for (const lecture of lectures) {
        await db.collection('semesters').doc(semesterId)
          .collection('lectures').add({
            subject: lecture.subject,
            faculty: lecture.faculty,
            day: lecture.day,
            startTime: lecture.startTime,
            endTime: lecture.endTime,
            room: lecture.room,
            status: 'scheduled',
            isCombined: false,
            createdFrom: 'pdf-upload',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        createdCount++;
      }

      // Log successful upload
      await db.collection('pdf_uploads').add({
        semesterId,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
        lecturesCreated: createdCount,
        clashesFound: false,
      });

      // Notify faculty and students
      await notifyUsers(
        semesterId,
        `Timetable updated: ${createdCount} lectures scheduled.`,
        'timetable-updated'
      );

    } catch (error) {
      console.error('Error processing PDF:', error);

      await db.collection('pdf_uploads').add({
        semesterId,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        errorLog: `PDF parsing failed: ${error.message}. Please upload a valid timetable PDF.`,
      });

      await notifyAdmin(
        semesterId,
        'Timetable PDF could not be processed',
        error.message
      );
    }
  });

// ============================================================================
// 3. LECTURE MANAGEMENT: Cancel, Reschedule, Combine
// ============================================================================

exports.cancelLecture = functions.https.onCall(async (data, context) => {
  try {
    const { semesterId, lectureId, reason } = data;

    if (!context.auth) {
      throw new Error('Authentication required.');
    }

    // Verify user is faculty/admin for this lecture
    await verifyFacultyAccess(context.auth.uid, semesterId);

    const lectureRef = db.collection('semesters').doc(semesterId)
      .collection('lectures').doc(lectureId);

    await lectureRef.update({
      status: 'cancelled',
      cancelReason: reason || 'No reason provided',
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify all students in this semester
    await sendNotification(semesterId, {
      type: 'lecture-cancelled',
      title: `Lecture Cancelled`,
      message: `A lecture has been cancelled. Check the timetable for details.`,
      affectedLectures: [lectureId],
    });

    return { success: true, message: 'Lecture cancelled and students notified.' };
  } catch (error) {
    console.error('Error cancelling lecture:', error);
    return { success: false, message: error.message };
  }
});

exports.rescheduleLecture = functions.https.onCall(async (data, context) => {
  try {
    const { semesterId, lectureId, newDay, newStartTime, newEndTime } = data;

    if (!context.auth) {
      throw new Error('Authentication required.');
    }

    await verifyFacultyAccess(context.auth.uid, semesterId);

    const lectureRef = db.collection('semesters').doc(semesterId)
      .collection('lectures').doc(lectureId);

    const lectureDoc = await lectureRef.get();
    const oldTime = `${lectureDoc.data().day} ${lectureDoc.data().startTime}`;

    await lectureRef.update({
      day: newDay,
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'rescheduled',
      originalTime: oldTime,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendNotification(semesterId, {
      type: 'lecture-rescheduled',
      title: 'Lecture Time Changed',
      message: `A lecture has been rescheduled. Check timetable for new time.`,
      affectedLectures: [lectureId],
    });

    return { success: true, message: 'Lecture rescheduled and students notified.' };
  } catch (error) {
    console.error('Error rescheduling lecture:', error);
    return { success: false, message: error.message };
  }
});

// ============================================================================
// 4. NOTIFICATIONS: Send announcements
// ============================================================================

exports.sendAnnouncement = functions.https.onCall(async (data, context) => {
  try {
    const { semesterId, title, message } = data;

    if (!context.auth) {
      throw new Error('Authentication required.');
    }

    await verifyFacultyAccess(context.auth.uid, semesterId);

    if (!title || !message) {
      throw new Error('Title and message are required.');
    }

    await sendNotification(semesterId, {
      type: 'announcement',
      title: title,
      message: message,
      sentBy: context.auth.uid,
    });

    return { success: true, message: 'Announcement sent to all students.' };
  } catch (error) {
    console.error('Error sending announcement:', error);
    return { success: false, message: error.message };
  }
});

// ============================================================================
// 5. ENROLLMENT: Fetch Google Form responses and create student records
// ============================================================================

exports.syncStudentEnrollments = functions.https.onCall(async (data, context) => {
  try {
    const { semesterId, googleFormSpreadsheetId, range } = data;

    if (!context.auth) {
      throw new Error('Authentication required.');
    }

    // Verify user is admin
    await verifyAdminAccess(context.auth.uid);

    // Fetch responses from Google Sheets (requires Google API key in env var)
    const responses = await fetchGoogleFormResponses(googleFormSpreadsheetId, range);

    let createdCount = 0;
    const errors = [];

    for (const response of responses) {
      try {
        const { enrollmentNo, name, phone } = response;

        if (!enrollmentNo || !phone) {
          errors.push(`Invalid response: missing enrollment or phone.`);
          continue;
        }

        // Create student record
        await db.collection('semesters').doc(semesterId)
          .collection('students').doc(enrollmentNo).set({
            enrollmentNo,
            name: name || `Student ${enrollmentNo}`,
            phone,
            status: 'active',
            authCreated: false,
            passwordChanged: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

        createdCount++;
      } catch (err) {
        errors.push(`Failed to create ${response.enrollmentNo}: ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Synced ${createdCount} students. ${errors.length} errors.`,
      errors,
    };
  } catch (error) {
    console.error('Error syncing enrollments:', error);
    return { success: false, message: error.message };
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse timetable text from PDF.
 * Expected format: Subject | Faculty | Day | StartTime | EndTime | Room
 */
function parseTimetableText(text, semesterId) {
  const lectures = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.trim().length === 0) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 6) continue;

    lectures.push({
      subject: parts[0],
      faculty: parts[1],
      day: parts[2],
      startTime: parts[3],
      endTime: parts[4],
      room: parts[5],
    });
  }

  return lectures;
}

/**
 * Detect faculty time clashes.
 */
async function detectClashes(newLectures, semesterId) {
  const clashes = [];
  const existingLectures = await db.collection('semesters').doc(semesterId)
    .collection('lectures').get();

  const facultySchedule = {};

  // Build existing schedule
  for (const doc of existingLectures.docs) {
    const lecture = doc.data();
    const key = `${lecture.faculty}-${lecture.day}`;
    if (!facultySchedule[key]) {
      facultySchedule[key] = [];
    }
    facultySchedule[key].push({
      startTime: lecture.startTime,
      endTime: lecture.endTime,
      subject: lecture.subject,
    });
  }

  // Check new lectures for clashes
  for (const newLecture of newLectures) {
    const key = `${newLecture.faculty}-${newLecture.day}`;
    if (facultySchedule[key]) {
      for (const existing of facultySchedule[key]) {
        if (timesOverlap(newLecture.startTime, newLecture.endTime,
          existing.startTime, existing.endTime)) {
          clashes.push({
            faculty: newLecture.faculty,
            day: newLecture.day,
            newLecture: newLecture.subject,
            existingLecture: existing.subject,
          });
        }
      }
    }
  }

  return clashes;
}

/**
 * Check if two time slots overlap.
 */
function timesOverlap(start1, end1, start2, end2) {
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
}

/**
 * Send notification to all users in a semester.
 */
async function sendNotification(semesterId, notificationData) {
  const docRef = await db.collection('semesters').doc(semesterId)
    .collection('notifications').add({
      ...notificationData,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      readBy: [],
    });

  return docRef.id;
}

/**
 * Notify admin about issues.
 */
async function notifyAdmin(semesterId, title, details) {
  console.log(`ADMIN NOTIFICATION [${semesterId}]: ${title}`, details);
  // In production, send email or SMS to admin
}

/**
 * Notify all users in semester.
 */
async function notifyUsers(semesterId, message, type) {
  console.log(`USER NOTIFICATION [${semesterId}]: ${message}`);
  // In production, trigger FCM notifications
}

/**
 * Deliver credentials via SMS or WhatsApp (simulated delivery).
 * Records the message in Firestore `message_logs` collection so admins can audit deliveries.
 */
async function deliverCredentials(phone, enrollmentNo, password, semesterId, method = 'sms') {
  console.log(`MOCK ${method.toUpperCase()}: Sending credentials to ${phone}`);
  console.log(`Enrollment: ${enrollmentNo}, Password: ${password}`);

  // Compose message body
  const messageBody = `Your LecScheduler account\nUsername: ${enrollmentNo}\nPassword: ${password}\nPlease login and change your password.`;

  // Save simulated delivery to Firestore (admin-only collection)
  try {
    await db.collection('message_logs').add({
      semesterId: semesterId || null,
      enrollment_no: enrollmentNo,
      phone: phone,
      message_type: 'LOGIN_CREDENTIALS',
      message_body: messageBody,
      status: 'SENT',
      delivery_method: method,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`MESSAGE LOGGED for ${enrollmentNo} (${phone})`);
    return true;
  } catch (err) {
    console.error('Failed to write message log:', err);
    // Fallback to console log but do not block account creation
    return false;
  }
} 

/**
 * Fetch responses from Google Form (Google Sheets).
 */
async function fetchGoogleFormResponses(spreadsheetId, range) {
  // TODO: Use Google Sheets API v4
  // For now, return empty array
  console.log('TODO: Implement Google Sheets API integration');
  return [];
}

/**
 * Verify user is faculty for a semester.
 */
async function verifyFacultyAccess(uid, semesterId) {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || !['faculty', 'admin'].includes(userDoc.data().role)) {
    throw new Error('Unauthorized. Faculty or admin access required.');
  }
  if (!userDoc.data().semesters.includes(semesterId)) {
    throw new Error('Unauthorized for this semester.');
  }
}

/**
 * Verify user is admin.
 */
async function verifyAdminAccess(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

module.exports = {
  createStudentAuth: exports.createStudentAuth,
  processPDFTimetable: exports.processPDFTimetable,
  cancelLecture: exports.cancelLecture,
  rescheduleLecture: exports.rescheduleLecture,
  sendAnnouncement: exports.sendAnnouncement,
  syncStudentEnrollments: exports.syncStudentEnrollments,
};
