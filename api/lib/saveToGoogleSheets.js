/**
 * Save parsed lectures to Google Sheets for permanent storage
 */
async function saveToGoogleSheets(lectures, semesterId) {
    const { google } = require('googleapis');

    // Check if service account credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.warn('GOOGLE_SERVICE_ACCOUNT_KEY not configured, skipping Sheet creation');
        return null;
    }

    try {
        // Auth with service account
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const drive = google.drive({ version: 'v3', auth });

        // Create new spreadsheet
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: `Timetable - ${semesterId} - ${new Date().toISOString().split('T')[0]}`,
                },
                sheets: [{
                    properties: {
                        title: 'Lectures',
                        gridProperties: {
                            frozenRowCount: 1
                        }
                    }
                }]
            },
        });

        const sheetId = spreadsheet.data.spreadsheetId;

        // Prepare data
        const headers = ['Day', 'Start Time', 'End Time', 'Subject', 'Subject Code', 'Faculty', 'Room', 'Semester', 'Section'];
        const rows = lectures.map(l => [
            l.day || '',
            l.startTime || '',
            l.endTime || '',
            l.subject || '',
            l.subjectCode || '',
            l.faculty || '',
            l.room || '',
            l.semester || '',
            l.section || ''
        ]);

        // Write to sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: 'Lectures!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers, ...rows],
            },
        });

        // Format header row (bold)
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                textFormat: { bold: true },
                                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                            }
                        },
                        fields: 'userEnteredFormat(textFormat,backgroundColor)'
                    }
                }]
            }
        });

        // Make sheet publicly readable (view-only)
        await drive.permissions.create({
            fileId: sheetId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
        console.log(`Created Google Sheet: ${sheetUrl}`);

        return sheetUrl;

    } catch (error) {
        console.error('Error creating Google Sheet:', error.message);
        throw error;
    }
}

module.exports = saveToGoogleSheets;
