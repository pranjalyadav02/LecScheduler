// ============================================================================
// ADMIN DASHBOARD JAVASCRIPT
// ============================================================================

let currentSemesterId = null;
const { db, storage, functions, auth } = window.firebaseApp;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if user is authenticated and is admin
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // Verify admin role
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                showError('Unauthorized. Admin access required.');
                setTimeout(() => logout(), 2000);
                return;
            }

            document.getElementById('adminName').textContent = user.displayName || 'Admin';
            loadSemesters();
        });
    } catch (error) {
        showError(error.message);
    }
});

// ============================================================================
// SEMESTER MANAGEMENT
// ============================================================================

async function loadSemesters() {
    try {
        const snapshot = await db.collection('semesters').get();
        const select = document.getElementById('semesterSelect');

        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name || doc.id;
            select.appendChild(option);
        });
    } catch (error) {
        showError(`Failed to load semesters: ${error.message}`);
    }
}

async function loadSemesterData() {
    currentSemesterId = document.getElementById('semesterSelect').value;
    if (!currentSemesterId) {
        showStatus('uploadStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        loadTimetableSummary();
        loadFacultyList();
    } catch (error) {
        showError(error.message);
    }
}

// ============================================================================
// PDF UPLOAD & TIMETABLE
// ============================================================================

async function handlePDFUpload(event) {
    event.preventDefault();

    if (!currentSemesterId) {
        showStatus('uploadStatus', 'Please select a semester first', 'warning');
        return;
    }

    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('uploadStatus', 'Please choose a file', 'error');
        return;
    }

    if (!file.type.includes('pdf')) {
        showStatus('uploadStatus', 'Please upload a valid PDF file', 'error');
        return;
    }

    try {
        showStatus('uploadStatus', 'Uploading and processing timetable...', 'info');

        const storagePath = `timetables/${currentSemesterId}/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(storagePath);

        // Upload file
        await storageRef.put(file);
        showStatus('uploadStatus', 'PDF uploaded. Processing... this may take a minute.', 'success');

        // Clear file input
        fileInput.value = '';

        // Poll for completion
        setTimeout(() => checkUploadStatus(), 3000);
    } catch (error) {
        showStatus('uploadStatus', `Upload failed: ${error.message}`, 'error');
    }
}

async function checkUploadStatus() {
    try {
        const uploads = await db.collection('pdf_uploads')
            .where('semesterId', '==', currentSemesterId)
            .orderBy('uploadedAt', 'desc')
            .limit(1)
            .get();

        if (uploads.empty) {
            return;
        }

        const latestUpload = uploads.docs[0].data();

        if (latestUpload.status === 'processing') {
            setTimeout(() => checkUploadStatus(), 3000);
            return;
        }

        if (latestUpload.status === 'success') {
            showStatus('uploadStatus', 
                `✓ Successfully created ${latestUpload.lecturesCreated} lectures.`, 
                'success');
        } else if (latestUpload.status === 'failed') {
            const errorMsg = latestUpload.clashesFound 
                ? 'Scheduling conflicts detected. Please resolve faculty time clashes.'
                : latestUpload.errorLog;
            showStatus('uploadStatus', `✗ ${errorMsg}`, 'error');
        }

        loadTimetableSummary();
    } catch (error) {
        showStatus('uploadStatus', `Error checking status: ${error.message}`, 'error');
    }
}

async function loadTimetableSummary() {
    try {
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('status', '!=', 'archived')
            .get();

        const counts = {
            total: lectures.size,
            scheduled: 0,
            cancelled: 0,
            rescheduled: 0,
        };

        lectures.forEach(doc => {
            const status = doc.data().status;
            if (status === 'scheduled') counts.scheduled++;
            else if (status === 'cancelled') counts.cancelled++;
            else if (status === 'rescheduled') counts.rescheduled++;
        });

        const msg = `Total: ${counts.total} | Scheduled: ${counts.scheduled} | Cancelled: ${counts.cancelled} | Rescheduled: ${counts.rescheduled}`;
        showStatus('lectureStatus', msg, 'info');
    } catch (error) {
        showStatus('lectureStatus', `Error loading timetable: ${error.message}`, 'error');
    }
}

async function showTimetableModal() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .orderBy('day')
            .orderBy('startTime')
            .get();

        const listDiv = document.getElementById('timetableList');
        listDiv.innerHTML = '';

        if (lectures.empty) {
            listDiv.innerHTML = '<p>No lectures found. Upload a timetable PDF.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Status</th>
                </tr>
            `;

            lectures.forEach(doc => {
                const lecture = doc.data();
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${lecture.subject}</td>
                    <td>${lecture.faculty}</td>
                    <td>${lecture.day}</td>
                    <td>${lecture.startTime} - ${lecture.endTime}</td>
                    <td>${lecture.room}</td>
                    <td><span class="status-badge ${lecture.status}">${lecture.status}</span></td>
                `;
            });

            listDiv.appendChild(table);
        }

        document.getElementById('timetableModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading timetable: ${error.message}`);
    }
}

function closeTimetableModal() {
    document.getElementById('timetableModal').style.display = 'none';
}

// ============================================================================
// FACULTY MANAGEMENT
// ============================================================================

async function loadFacultyList() {
    try {
        const faculty = await db.collection('semesters').doc(currentSemesterId)
            .collection('faculty')
            .where('status', '==', 'active')
            .get();

        const listDiv = document.getElementById('facultyList');
        if (!listDiv) return;

        listDiv.innerHTML = '';

        if (faculty.empty) {
            listDiv.innerHTML = '<p>No faculty added. Add one to get started.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Action</th>
                </tr>
            `;

            faculty.forEach(doc => {
                const f = doc.data();
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${f.name}</td>
                    <td>${f.phone}</td>
                    <td>${f.email}</td>
                    <td><button onclick="removeFaculty('${doc.id}')" class="danger-btn">Remove</button></td>
                `;
            });

            listDiv.appendChild(table);
        }
    } catch (error) {
        showError(`Error loading faculty: ${error.message}`);
    }
}

async function showFacultyModal() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    document.getElementById('facultyModal').style.display = 'block';
    loadFacultyList();
}

function closeFacultyModal() {
    document.getElementById('facultyModal').style.display = 'none';
}

async function handleAddFaculty(event) {
    event.preventDefault();

    try {
        const name = document.getElementById('facultyName').value;
        const phone = document.getElementById('facultyPhone').value;
        const email = document.getElementById('facultyEmail').value;

        await db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').add({
                name,
                phone,
                email,
                status: 'active',
                subjects: [],
                createdAt: new Date(),
            });

        document.querySelector('.faculty-form').reset();
        loadFacultyList();
        showStatus('uploadStatus', `✓ Faculty "${name}" added successfully.`, 'success');
    } catch (error) {
        showStatus('uploadStatus', `Failed to add faculty: ${error.message}`, 'error');
    }
}

async function removeFaculty(facultyId) {
    if (!confirm('Remove this faculty?')) return;

    try {
        await db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').doc(facultyId).update({
                status: 'inactive',
            });

        loadFacultyList();
        showStatus('uploadStatus', '✓ Faculty removed.', 'success');
    } catch (error) {
        showStatus('uploadStatus', `Error: ${error.message}`, 'error');
    }
}

// ============================================================================
// STUDENT SYNC
// ============================================================================

async function handleStudentSync(event) {
    event.preventDefault();

    if (!currentSemesterId) {
        showStatus('syncStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        showStatus('syncStatus', 'Syncing students... (implementing Google Forms API)', 'info');

        // TODO: Call Cloud Function to fetch Google Form responses
        // For now, show placeholder

        showStatus('syncStatus', 'Google Forms sync not yet implemented. Please contact support.', 'warning');
    } catch (error) {
        showStatus('syncStatus', `Sync failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

async function handleAnnouncement(event) {
    event.preventDefault();

    if (!currentSemesterId) {
        showStatus('announcementStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const title = document.getElementById('announcementTitle').value;
        const message = document.getElementById('announcementMsg').value;

        showStatus('announcementStatus', 'Sending announcement...', 'info');

        // Call Cloud Function
        const sendAnnouncement = window.firebase.functions().httpsCallable('sendAnnouncement');
        const result = await sendAnnouncement({
            semesterId: currentSemesterId,
            title,
            message,
        });

        if (result.data.success) {
            document.querySelector('.announcement-form').reset();
            showStatus('announcementStatus', '✓ Announcement sent to all students.', 'success');
        } else {
            showStatus('announcementStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('announcementStatus', `Failed to send: ${error.message}`, 'error');
    }
}

// ============================================================================
// NOTIFICATIONS LOG
// ============================================================================

async function showNotificationLog() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const notifications = await db.collection('semesters').doc(currentSemesterId)
            .collection('notifications')
            .orderBy('sentAt', 'desc')
            .limit(50)
            .get();

        const listDiv = document.getElementById('notificationList');
        listDiv.innerHTML = '';

        if (notifications.empty) {
            listDiv.innerHTML = '<p>No notifications sent yet.</p>';
        } else {
            const list = document.createElement('div');
            list.className = 'notification-list';

            notifications.forEach(doc => {
                const notif = doc.data();
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.innerHTML = `
                    <strong>${notif.type}</strong><br>
                    <em>${notif.title}</em><br>
                    ${notif.message}<br>
                    <small>Sent: ${new Date(notif.sentAt.toDate()).toLocaleString()}</small>
                `;
                list.appendChild(item);
            });

            listDiv.appendChild(list);
        }

        document.getElementById('notificationModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading notifications: ${error.message}`);
    }
}

function closeNotificationModal() {
    document.getElementById('notificationModal').style.display = 'none';
}

// ============================================================================
// MESSAGE LOG (Simulated SMS/WhatsApp)
// ============================================================================

async function showMessageLog() {
    if (!currentSemesterId) {
        showStatus('lectureStatus', 'Please select a semester', 'warning');
        return;
    }

    try {
        const messages = await db.collection('message_logs')
            .where('semesterId', '==', currentSemesterId)
            .orderBy('timestamp', 'desc')
            .limit(200)
            .get();

        const listDiv = document.getElementById('messageLogList');
        listDiv.innerHTML = '';

        if (messages.empty) {
            listDiv.innerHTML = '<p>No messages logged yet.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Date & Time</th>
                    <th>Enrollment No</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            `;

            messages.forEach(doc => {
                const m = doc.data();
                const row = table.insertRow();
                const ts = m.timestamp ? new Date(m.timestamp.toDate()).toLocaleString() : '—';
                row.innerHTML = `
                    <td>${ts}</td>
                    <td>${m.enrollment_no || '—'}</td>
                    <td>${m.phone || '—'}</td>
                    <td>${m.message_type || '—'}</td>
                    <td>${m.status || '—'}</td>
                    <td><button class="primary-btn" onclick='showMessageDetails(${JSON.stringify(m).replace(/'/g, "\\'")})'>View</button></td>
                `;
            });

            listDiv.appendChild(table);
        }

        document.getElementById('messageLogModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading message log: ${error.message}`);
    }
}

function closeMessageLog() {
    document.getElementById('messageLogModal').style.display = 'none';
}

function showMessageDetails(message) {
    const detailsDiv = document.getElementById('messageDetails');
    const ts = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleString() : '—';

    detailsDiv.innerHTML = `
        <p><strong>To:</strong> ${message.phone || '—'}</p>
        <p><strong>Enrollment:</strong> ${message.enrollment_no || '—'}</p>
        <p><strong>Type:</strong> ${message.message_type || '—'}</p>
        <p><strong>Timestamp:</strong> ${ts}</p>
        <hr>
        <pre style="white-space:pre-wrap;">${message.message_body || ''}</pre>
        <p><strong>Status:</strong> ${message.status || '—'}</p>
    `;

    document.getElementById('messageDetailsModal').style.display = 'block';
}

function closeMessageDetails() {
    document.getElementById('messageDetailsModal').style.display = 'none';
}

// ============================================================================
// SEMESTER ARCHIVING
// ============================================================================

async function confirmArchiveSemester() {
    if (!currentSemesterId) {
        showStatus('archiveStatus', 'Please select a semester', 'warning');
        return;
    }

    const confirmMsg = `This will archive the semester and disable all student access. This cannot be undone. Continue?`;

    if (!confirm(confirmMsg)) return;

    try {
        showStatus('archiveStatus', 'Archiving semester...', 'info');

        // Mark semester as inactive
        await db.collection('semesters').doc(currentSemesterId).update({
            active: false,
        });

        // Mark all lectures as archived
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures').get();

        const batch = db.batch();
        lectures.forEach(doc => {
            batch.update(doc.ref, { status: 'archived' });
        });
        await batch.commit();

        // Mark all students as archived
        const students = await db.collection('semesters').doc(currentSemesterId)
            .collection('students').get();

        const batch2 = db.batch();
        students.forEach(doc => {
            batch2.update(doc.ref, { status: 'archived' });
        });
        await batch2.commit();

        showStatus('archiveStatus', '✓ Semester archived successfully.', 'success');
        loadSemesters();
    } catch (error) {
        showStatus('archiveStatus', `Archive failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// SETTINGS
// ============================================================================

async function showSettingsModal() {
    try {
        const settings = await db.collection('admin_settings').doc('config').get();

        if (settings.exists) {
            const data = settings.data();
            document.getElementById('appName').value = data.appName || '';
            document.getElementById('institution').value = data.institution || '';
            document.getElementById('supportPhone').value = data.supportPhone || '';
            document.getElementById('deliveryMethod').value = data.credentialDeliveryMethod || 'sms';
        }

        document.getElementById('settingsModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading settings: ${error.message}`);
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function handleSettingsSave(event) {
    event.preventDefault();

    try {
        const settings = {
            appName: document.getElementById('appName').value,
            institution: document.getElementById('institution').value,
            supportPhone: document.getElementById('supportPhone').value,
            credentialDeliveryMethod: document.getElementById('deliveryMethod').value,
        };

        await db.collection('admin_settings').doc('config').set(settings, { merge: true });

        showStatus('uploadStatus', '✓ Settings saved.', 'success');
        closeSettingsModal();
    } catch (error) {
        showStatus('uploadStatus', `Failed to save settings: ${error.message}`, 'error');
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `status-message ${type}`;
    }
}

function showError(message) {
    console.error(message);
    alert('Error: ' + message);
}

function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch(error => {
        showError(error.message);
    });
}
