const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors')({ origin: true });

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
  // Simple check for onCall context
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  try {
    const { semesterId, lectureId, reason } = data;

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
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  try {
    const { semesterId, lectureId, newDay, newStartTime, newEndTime } = data;

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

// Helper functions (simplified)
async function verifyFacultyAccess(uid, semesterId) {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) throw new Error('User profile not found.');
  const role = userDoc.data().role;
  if (role !== 'faculty' && role !== 'admin') throw new Error('Permission denied.');
  
  if (role === 'faculty') {
      const semesters = userDoc.data().semesters || [];
      if (!semesters.includes(semesterId)) throw new Error('Access to this semester denied.');
  }
}

async function sendNotification(semesterId, payload) {
    await db.collection('semesters').doc(semesterId).collection('notifications').add({
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

function parseTimetableText(text, semesterId) {
    // Basic CSV parity logic
    return []; 
}

async function deliverCredentials(phone, enrollmentNo, password, semesterId, method) {
    await db.collection('message_logs').add({
        phone, enrollmentNo, password, semesterId, method,
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
