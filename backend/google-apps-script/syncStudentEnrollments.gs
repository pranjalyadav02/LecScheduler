/**
 * Google Apps Script: Sync Student Enrollments from Google Form
 * 
 * SETUP:
 * 1. Create Google Form for student registration
 *    - Name field
 *    - Enrollment number field
 *    - Phone field
 * 2. Create new Google Apps Script project (linked to the Form)
 * 3. Copy this file into the editor
 * 4. Set environment variables:
 *    - FIREBASE_PROJECT_ID = "lecscheduler-4e36b"
 *    - FIREBASE_API_KEY = "[Your Firebase API Key]"
 *    - FIREBASE_DB_URL = "https://lecscheduler-4e36b.firebaseio.com"
 * 5. Deploy as web app (Execute as: Me, Who has access: Anyone)
 * 6. Set up Form submit trigger → Run syncStudentEnrollments on form submit
 * 
 * The script automatically syncs new form responses to Firestore
 */

const FIREBASE_PROJECT_ID = "lecscheduler-4e36b";
const FIREBASE_API_KEY = PropertiesService.getScriptProperties().getProperty("FIREBASE_API_KEY");
const FIREBASE_DB_URL = "https://lecscheduler-4e36b.firebaseio.com";

/**
 * Trigger: Runs automatically when Google Form is submitted
 */
function onFormSubmit(e) {
  try {
    const response = e.response;
    const itemResponses = response.getItemResponses();

    // Extract form fields
    let name = "", enrollmentNo = "", phone = "";

    for (const itemResponse of itemResponses) {
      const question = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();

      if (question.toLowerCase().includes('name')) {
        name = answer;
      } else if (question.toLowerCase().includes('enrollment')) {
        enrollmentNo = answer;
      } else if (question.toLowerCase().includes('phone')) {
        phone = answer;
      }
    }

    // Get semester from form description or properties
    const semesterId = PropertiesService.getScriptProperties().getProperty("SEMESTER_ID");

    if (!semesterId || !enrollmentNo || !phone) {
      Logger.log("Missing required fields");
      return;
    }

    // Create student record in Firestore
    const studentData = {
      enrollmentNo: enrollmentNo,
      name: name || `Student ${enrollmentNo}`,
      phone: phone,
      status: "active",
      authCreated: false,
      passwordChanged: false,
      createdAt: new Date().toISOString()
    };

    createStudentInFirestore(semesterId, enrollmentNo, studentData);

    // Send confirmation email to student
    sendConfirmationEmail(enrollmentNo, name, phone);

    Logger.log(`Student enrolled: ${enrollmentNo}`);

  } catch (error) {
    Logger.log("Error in onFormSubmit: " + error.message);
    sendAdminNotification("Form Submission Error", error.message);
  }
}

/**
 * HTTP endpoint to manually sync all form responses
 * Call via: POST to https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallable
 * Payload: { semesterId, formId }
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { semesterId, formId } = data;

    if (!semesterId || !formId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing semesterId or formId"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const result = syncAllFormResponses(semesterId, formId);

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
 * Manually sync all responses from a Google Form
 */
function syncAllFormResponses(semesterId, formId) {
  try {
    const form = FormApp.openById(formId);
    const responses = form.getResponses();

    let createdCount = 0;
    const errors = [];

    for (const response of responses) {
      try {
        const itemResponses = response.getItemResponses();

        let name = "", enrollmentNo = "", phone = "";

        for (const itemResponse of itemResponses) {
          const question = itemResponse.getItem().getTitle();
          const answer = itemResponse.getResponse();

          if (question.toLowerCase().includes('name')) {
            name = answer;
          } else if (question.toLowerCase().includes('enrollment')) {
            enrollmentNo = answer;
          } else if (question.toLowerCase().includes('phone')) {
            phone = answer;
          }
        }

        if (!enrollmentNo || !phone) {
          errors.push("Invalid response: missing enrollment or phone");
          continue;
        }

        // Create student record
        const studentData = {
          enrollmentNo: enrollmentNo,
          name: name || `Student ${enrollmentNo}`,
          phone: phone,
          status: "active",
          authCreated: false,
          passwordChanged: false,
          createdAt: new Date().toISOString()
        };

        createStudentInFirestore(semesterId, enrollmentNo, studentData);
        createdCount++;

      } catch (err) {
        errors.push(`Failed to create student: ${err.message}`);
      }
    }

    Logger.log(`Synced ${createdCount} students`);

    return {
      success: true,
      message: `Synced ${createdCount} students. ${errors.length} errors.`,
      createdCount: createdCount,
      errors: errors
    };

  } catch (error) {
    Logger.log("Error syncing form responses: " + error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Sync from Google Sheets (if admin prefers uploading CSV to Sheets)
 * Call via: POST { semesterId, spreadsheetId, range }
 */
function syncFromGoogleSheets(semesterId, spreadsheetId, range = "Sheet1!A2:C") {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(range.split('!')[0]);
    const values = sheet.getRange(range).getValues();

    let createdCount = 0;
    const errors = [];

    for (const row of values) {
      try {
        const enrollmentNo = row[0];
        const name = row[1];
        const phone = row[2];

        if (!enrollmentNo || !phone) {
          errors.push(`Invalid row: ${JSON.stringify(row)}`);
          continue;
        }

        const studentData = {
          enrollmentNo: enrollmentNo,
          name: name || `Student ${enrollmentNo}`,
          phone: phone,
          status: "active",
          authCreated: false,
          passwordChanged: false,
          createdAt: new Date().toISOString()
        };

        createStudentInFirestore(semesterId, enrollmentNo, studentData);
        createdCount++;

      } catch (err) {
        errors.push(`Failed to process row: ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Synced ${createdCount} students from Sheets`,
      createdCount: createdCount,
      errors: errors
    };

  } catch (error) {
    Logger.log("Error syncing from Sheets: " + error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Create student record in Firestore
 */
function createStudentInFirestore(semesterId, enrollmentNo, studentData) {
  const url = `${FIREBASE_DB_URL}/semesters/${semesterId}/students/${enrollmentNo}.json?key=${FIREBASE_API_KEY}`;

  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(studentData),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(`Firestore write response: ${response.getResponseCode()}`);
  return response.getResponseCode() === 200;
}

/**
 * Send confirmation email to student
 */
function sendConfirmationEmail(enrollmentNo, name, phone) {
  const subject = "[LecScheduler] Enrollment Confirmed";
  const message = `
Dear ${name},

Your enrollment has been confirmed in the LecScheduler system.

Enrollment Number: ${enrollmentNo}
Phone: ${phone}

You will receive your login credentials via SMS shortly.

Best regards,
LecScheduler Team
  `;

  // Send to a staff email or notification log
  Logger.log(`Confirmation email would be sent to ${enrollmentNo}: ${message}`);
}

/**
 * Send notification to admin
 */
function sendAdminNotification(subject, details) {
  const adminEmail = Session.getActiveUser().getEmail();

  MailApp.sendEmail(
    adminEmail,
    `[LecScheduler] ${subject}`,
    `Details: ${details}\nTime: ${new Date()}`
  );
}

/**
 * Test function: Create sample students for testing
 */
function createTestStudents() {
  const semesterId = "sem-2024-s1";
  const testStudents = [
    { enrollmentNo: "23001", name: "Alice Johnson", phone: "+91-9876543210" },
    { enrollmentNo: "23002", name: "Bob Smith", phone: "+91-9876543211" },
    { enrollmentNo: "23003", name: "Carol White", phone: "+91-9876543212" }
  ];

  for (const student of testStudents) {
    createStudentInFirestore(semesterId, student.enrollmentNo, {
      ...student,
      status: "active",
      authCreated: false,
      passwordChanged: false,
      createdAt: new Date().toISOString()
    });
  }

  Logger.log("Test students created");
}
