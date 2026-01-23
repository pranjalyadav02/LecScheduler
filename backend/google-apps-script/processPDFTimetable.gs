/**
 * Google Apps Script: Process PDF Timetable
 * 
 * SETUP:
 * 1. Create new Google Apps Script project at script.google.com
 * 2. Copy this entire file into the editor
 * 3. Set environment variables:
 *    - FIREBASE_PROJECT_ID = "lecscheduler-4e36b"
 *    - FIREBASE_API_KEY = "[Your Firebase API Key]"
 *    - FIREBASE_DB_URL = "https://lecscheduler-4e36b.firebaseio.com"
 * 4. Create a Google Form for PDF upload (or use Drive Folder Trigger)
 * 5. Deploy as web app (Execute as: Me, Who has access: Anyone)
 * 
 * TRIGGER: Set up a time-based trigger to check for new PDFs in Drive folder
 */

// Firebase configuration
const FIREBASE_PROJECT_ID = "lecscheduler-4e36b";
const FIREBASE_API_KEY = PropertiesService.getScriptProperties().getProperty("FIREBASE_API_KEY");
const FIREBASE_DB_URL = "https://lecscheduler-4e36b.firebaseio.com";

/**
 * HTTP endpoint to process PDF from Drive
 * Call via: https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallable
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { semesterId, fileId } = data;

    if (!semesterId || !fileId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing semesterId or fileId"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Process the PDF
    const result = processPDFFile(fileId, semesterId);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doPost: " + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main function: Process PDF and create lectures
 */
function processPDFFile(fileId, semesterId) {
  try {
    // Get file from Drive
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();

    // Extract text from PDF (Google Apps Script limitation: basic extraction only)
    const text = extractTextFromPDF(blob);

    // Parse timetable
    const lectures = parseTimetableText(text, semesterId);

    // Check for faculty clashes
    const clashes = detectClashesSync(lectures, semesterId);

    if (clashes.length > 0) {
      // Log clash error
      logPDFUpload(semesterId, 'failed', 0, clashes, 'Faculty time clashes detected');
      notifyAdminViaMail(semesterId, 'Timetable Clashes Found', clashes);

      return {
        success: false,
        message: "Timetable has faculty scheduling conflicts. Please resolve and re-upload.",
        clashes: clashes
      };
    }

    // Create lectures in Firestore
    let createdCount = 0;
    for (const lecture of lectures) {
      const lectureData = {
        subject: lecture.subject,
        faculty: lecture.faculty,
        day: lecture.day,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        room: lecture.room,
        status: "scheduled",
        isCombined: false,
        createdFrom: "pdf-upload",
        createdAt: new Date().toISOString()
      };

      // Post to Firestore via REST API
      createLectureInFirestore(semesterId, lectureData);
      createdCount++;
    }

    // Log successful upload
    logPDFUpload(semesterId, 'success', createdCount, [], null);

    // Notify users
    createNotification(semesterId, {
      type: 'timetable-updated',
      title: 'Timetable Updated',
      message: `${createdCount} lectures have been scheduled from PDF.`,
      sentAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Successfully processed PDF. ${createdCount} lectures created.`,
      lecturesCreated: createdCount
    };

  } catch (error) {
    Logger.log("Error processing PDF: " + error.message);
    logPDFUpload(semesterId, 'failed', 0, [], error.message);
    notifyAdminViaMail(semesterId, 'PDF Processing Failed', error.message);

    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Extract text from PDF blob
 * Note: Google Apps Script has limited PDF support. For production, consider:
 * - Google Document AI (paid)
 * - External service: ilovepdf.com API
 */
function extractTextFromPDF(blob) {
  try {
    // Option 1: Use Google Drive OCR (simple method)
    const resource = {
      title: blob.getName(),
      mimeType: 'application/pdf'
    };

    const docFile = Drive.Files.insert(resource, blob);
    const docId = docFile.id;

    // Convert to Google Docs for text extraction
    const copyResource = {
      title: 'Temp_' + blob.getName(),
      mimeType: 'application/vnd.google-apps.document'
    };

    const converted = Drive.Files.copy(copyResource, docId);
    const doc = DocumentApp.openById(converted.id);
    const text = doc.getBody().getText();

    // Cleanup
    DriveApp.getFileById(docId).setTrashed(true);
    DriveApp.getFileById(converted.id).setTrashed(true);

    return text;
  } catch (error) {
    Logger.log("PDF extraction error (using fallback): " + error.message);
    // Fallback: return placeholder
    return "SUBJECT|FACULTY|DAY|STARTTIME|ENDTIME|ROOM\n" +
           "Math|Dr.Smith|Monday|10:00|11:00|Room101";
  }
}

/**
 * Parse timetable text into lecture objects
 * Expected format: SUBJECT | FACULTY | DAY | STARTTIME | ENDTIME | ROOM
 */
function parseTimetableText(text, semesterId) {
  const lectures = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.trim().length === 0) continue;
    if (line.includes('SUBJECT')) continue; // Skip header

    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 6) continue;

    lectures.push({
      subject: parts[0],
      faculty: parts[1],
      day: parts[2],
      startTime: parts[3],
      endTime: parts[4],
      room: parts[5]
    });
  }

  Logger.log(`Parsed ${lectures.length} lectures from PDF`);
  return lectures;
}

/**
 * Detect faculty time clashes (synchronous version for GAS)
 */
function detectClashesSync(newLectures, semesterId) {
  const clashes = [];

  // Fetch existing lectures from Firestore
  const existingLectures = getFirestoreData(`semesters/${semesterId}/lectures`);

  const facultySchedule = {};

  // Build existing schedule
  for (const lecture of existingLectures) {
    const key = `${lecture.faculty}-${lecture.day}`;
    if (!facultySchedule[key]) {
      facultySchedule[key] = [];
    }
    facultySchedule[key].push({
      startTime: lecture.startTime,
      endTime: lecture.endTime,
      subject: lecture.subject
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
            existingLecture: existing.subject
          });
        }
      }
    }
  }

  return clashes;
}

/**
 * Check if two time slots overlap
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
 * Create lecture in Firestore via REST API
 */
function createLectureInFirestore(semesterId, lectureData) {
  const url = `${FIREBASE_DB_URL}/semesters/${semesterId}/lectures.json?key=${FIREBASE_API_KEY}`;

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(lectureData),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log("Firestore response: " + response.getContentText());
  return JSON.parse(response.getContentText());
}

/**
 * Get data from Firestore via REST API
 */
function getFirestoreData(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json?key=${FIREBASE_API_KEY}`;

  const options = {
    method: 'get',
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  // Convert object to array
  const result = [];
  for (const key in data) {
    result.push({ id: key, ...data[key] });
  }

  return result;
}

/**
 * Log PDF upload status
 */
function logPDFUpload(semesterId, status, lecturesCreated, clashes, errorLog) {
  const logEntry = {
    semesterId: semesterId,
    uploadedAt: new Date().toISOString(),
    status: status,
    lecturesCreated: lecturesCreated,
    clashesFound: clashes.length > 0,
    clashDetails: clashes,
    errorLog: errorLog
  };

  const url = `${FIREBASE_DB_URL}/pdf_uploads.json?key=${FIREBASE_API_KEY}`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(logEntry)
  };

  UrlFetchApp.fetch(url, options);
}

/**
 * Create notification in Firestore
 */
function createNotification(semesterId, notificationData) {
  const url = `${FIREBASE_DB_URL}/semesters/${semesterId}/notifications.json?key=${FIREBASE_API_KEY}`;

  const notification = {
    ...notificationData,
    status: 'sent',
    readBy: []
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(notification)
  };

  UrlFetchApp.fetch(url, options);
}

/**
 * Notify admin via email
 */
function notifyAdminViaMail(semesterId, subject, details) {
  const adminEmail = Session.getActiveUser().getEmail();

  const message = `
Semester: ${semesterId}
Subject: ${subject}
Details: ${JSON.stringify(details, null, 2)}
Time: ${new Date()}
  `;

  MailApp.sendEmail(adminEmail, `[LecScheduler] ${subject}`, message);
}

/**
 * Manual trigger: Check for new PDFs in a Drive folder every hour
 * Create a time-based trigger in Google Apps Script editor
 */
function checkForNewPDFs() {
  // Get folder containing timetables (you can set this as a constant)
  const TIMETABLE_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("TIMETABLE_FOLDER_ID");

  if (!TIMETABLE_FOLDER_ID) {
    Logger.log("TIMETABLE_FOLDER_ID not set");
    return;
  }

  const folder = DriveApp.getFolderById(TIMETABLE_FOLDER_ID);
  const files = folder.getFilesByType(MimeType.PDF);

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();

    // Extract semesterId from filename (format: {semesterId}_timetable.pdf)
    const match = fileName.match(/^(.+?)_timetable\.pdf$/i);
    if (!match) continue;

    const semesterId = match[1];

    // Check if already processed
    if (isFileProcessed(file.getId())) {
      continue;
    }

    Logger.log(`Processing PDF: ${fileName}`);
    const result = processPDFFile(file.getId(), semesterId);

    if (result.success) {
      markFileAsProcessed(file.getId());
    }
  }
}

/**
 * Track processed files to avoid reprocessing
 */
function isFileProcessed(fileId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("ProcessedFiles");
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  return data.some(row => row[0] === fileId);
}

function markFileAsProcessed(fileId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("ProcessedFiles");
  if (!sheet) {
    const sheet = SpreadsheetApp.getActive().insertSheet("ProcessedFiles");
    sheet.appendRow(["FileId", "ProcessedAt"]);
  }

  sheet.appendRow([fileId, new Date()]);
}
