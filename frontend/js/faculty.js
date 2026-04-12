// ============================================================================
// FACULTY PORTAL JAVASCRIPT
// ============================================================================

let currentSemesterId = null;
let currentFacultyId = null;
const { db, auth, functions } = window.firebaseApp;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // Load faculty data
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'faculty') {
                showError('Unauthorized. Faculty access required.');
                setTimeout(() => logout(), 2000);
                return;
            }

            document.getElementById('facultyName').textContent = user.displayName || 'Faculty';
            currentFacultyId = user.uid;

            // Get first semester for now (simplification)
            const semesters = userDoc.data().semesters || [];
            if (semesters.length > 0) {
                currentSemesterId = semesters[0];
                await loadSemesterInfo();
                await loadMyLecturesForSelect();
                await loadSubjectsForChat();
                await loadMessageRequests();
            } else {
                showError('No semester assigned to you.');
            }
        });
    } catch (error) {
        showError(error.message);
    }
});

// ============================================================================
// SEMESTER & LECTURES
// ============================================================================

async function loadSemesterInfo() {
    try {
        const semesterDoc = await db.collection('semesters').doc(currentSemesterId).get();
        if (semesterDoc.exists) {
            document.getElementById('semesterDisplay').textContent = 
                `Semester: ${semesterDoc.data().name}`;
        }
    } catch (error) {
        console.error('Error loading semester:', error);
    }
}

async function loadMyLecturesForSelect() {
    try {
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('faculty', '==', currentFacultyId)
            .where('status', '!=', 'cancelled')
            .where('status', '!=', 'archived')
            .orderBy('status')
            .orderBy('day')
            .get();

        // Populate cancel and reschedule selects
        const cancelSelect = document.getElementById('cancelLectureSelect');
        const rescheduleSelect = document.getElementById('rescheduleLectureSelect');

        cancelSelect.innerHTML = '<option value="">-- Select Lecture --</option>';
        rescheduleSelect.innerHTML = '<option value="">-- Select Lecture --</option>';

        lectures.forEach(doc => {
            const lecture = doc.data();
            const optionText = `${lecture.subject} - ${lecture.day} ${lecture.startTime} (${lecture.room})`;
            
            const opt1 = document.createElement('option');
            opt1.value = doc.id;
            opt1.textContent = optionText;
            cancelSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = doc.id;
            opt2.textContent = optionText;
            rescheduleSelect.appendChild(opt2);
        });
    } catch (error) {
        console.error('Error loading lectures:', error);
    }
}

async function showMyLectures() {
    if (!currentSemesterId) return;

    try {
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('faculty', '==', currentFacultyId)
            .orderBy('day')
            .orderBy('startTime')
            .get();

        const listDiv = document.getElementById('lecturesList');
        listDiv.innerHTML = '';

        if (lectures.empty) {
            listDiv.innerHTML = '<p>No lectures assigned to you.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Subject</th>
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
                    <td>${lecture.day}</td>
                    <td>${lecture.startTime} - ${lecture.endTime}</td>
                    <td>${lecture.room}</td>
                    <td><span class="status-badge ${lecture.status}">${lecture.status}</span></td>
                `;
            });

            listDiv.appendChild(table);
        }

        document.getElementById('lecturesModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading lectures: ${error.message}`);
    }
}

function closeLecturesModal() {
    document.getElementById('lecturesModal').style.display = 'none';
}

// ============================================================================
// CANCEL LECTURE
// ============================================================================

async function handleCancelLecture(event) {
    event.preventDefault();

    const lectureId = document.getElementById('cancelLectureSelect').value;
    const reason = document.getElementById('cancelReason').value;

    if (!lectureId) {
        showStatus('cancelStatus', 'Please select a lecture', 'warning');
        return;
    }

    try {
        showStatus('cancelStatus', 'Cancelling lecture...', 'info');

        const cancelLecture = functions.httpsCallable('cancelLecture');
        const result = await cancelLecture({
            semesterId: currentSemesterId,
            lectureId,
            reason,
        });

        if (result.data.success) {
            showStatus('cancelStatus', '✓ Lecture cancelled. Students notified.', 'success');
            document.getElementById('cancelReason').value = '';
            await loadMyLecturesForSelect();
            setTimeout(() => loadMyLecturesForSelect(), 1000);
        } else {
            showStatus('cancelStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('cancelStatus', `Failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// RESCHEDULE LECTURE
// ============================================================================

async function handleRescheduleLecture(event) {
    event.preventDefault();

    const lectureId = document.getElementById('rescheduleLectureSelect').value;
    const newDay = document.getElementById('newDay').value;
    const newStartTime = document.getElementById('newStartTime').value;
    const newEndTime = document.getElementById('newEndTime').value;

    if (!lectureId || !newDay || !newStartTime || !newEndTime) {
        showStatus('rescheduleStatus', 'Please fill all fields', 'warning');
        return;
    }

    // Validate times
    if (newStartTime >= newEndTime) {
        showStatus('rescheduleStatus', 'End time must be after start time', 'error');
        return;
    }

    try {
        showStatus('rescheduleStatus', 'Rescheduling lecture...', 'info');

        const rescheduleLecture = functions.httpsCallable('rescheduleLecture');
        const result = await rescheduleLecture({
            semesterId: currentSemesterId,
            lectureId,
            newDay,
            newStartTime,
            newEndTime,
        });

        if (result.data.success) {
            showStatus('rescheduleStatus', '✓ Lecture rescheduled. Students notified.', 'success');
            document.getElementById('newDay').value = '';
            document.getElementById('newStartTime').value = '';
            document.getElementById('newEndTime').value = '';
            await loadMyLecturesForSelect();
        } else {
            showStatus('rescheduleStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('rescheduleStatus', `Failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

async function handleFacultyAnnouncement(event) {
    event.preventDefault();

    const title = document.getElementById('facultyAnnouncementTitle').value;
    const message = document.getElementById('facultyAnnouncementMsg').value;

    if (!title || !message) {
        showStatus('facultyAnnouncementStatus', 'Please fill all fields', 'warning');
        return;
    }

    try {
        showStatus('facultyAnnouncementStatus', 'Sending announcement...', 'info');

        const sendAnnouncement = functions.httpsCallable('sendAnnouncement');
        const result = await sendAnnouncement({
            semesterId: currentSemesterId,
            title,
            message,
        });

        if (result.data.success) {
            showStatus('facultyAnnouncementStatus', '✓ Announcement sent to all students.', 'success');
            document.getElementById('facultyAnnouncementTitle').value = '';
            document.getElementById('facultyAnnouncementMsg').value = '';
        } else {
            showStatus('facultyAnnouncementStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('facultyAnnouncementStatus', `Failed: ${error.message}`, 'error');
    }
}

// ============================================================================
// SUBJECT CHAT
// ============================================================================

async function loadSubjectsForChat() {
    try {
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('faculty', '==', currentFacultyId)
            .get();

        const select = document.getElementById('chatSubjectSelect');
        if (!select) return;

        const subjects = [...new Set(lectures.docs.map(doc => doc.data().subject))].sort();
        
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Select Subject --</option>';
        subjects.forEach(subject => {
            const opt = document.createElement('option');
            opt.value = subject;
            opt.textContent = subject;
            if (subject === currentVal) opt.selected = true;
            select.appendChild(opt);
        });

        // If a subject is selected, start real-time listener for messages
        if (currentVal) {
            const messagesDiv = document.getElementById('subjectChatMessages');
            db.collection('semesters').doc(currentSemesterId)
                .collection('subjects').doc(currentVal)
                .collection('chat')
                .orderBy('timestamp', 'asc')
                .limitToLast(50)
                .onSnapshot(snapshot => {
                    messagesDiv.innerHTML = '';
                    if (snapshot.empty) {
                        messagesDiv.innerHTML = '<p class="empty-message">No messages yet.</p>';
                    } else {
                        snapshot.forEach(doc => {
                            const msg = doc.data();
                            const item = document.createElement('div');
                            item.className = `chat-message ${msg.senderRole === 'faculty' ? 'staff' : 'student'}`;
                            const time = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : '--';
                            
                            item.innerHTML = `
                                <div class="message-header">
                                    <strong>${msg.senderName}</strong> <small>${time}</small>
                                </div>
                                <div class="message-body">${escapeHtml(msg.message)}</div>
                            `;
                            messagesDiv.appendChild(item);
                        });
                        messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    }
                });
        }
    } catch (error) {
        console.error('Error loading subjects for chat:', error);
    }
}

async function handleSendSubjectMessage(event) {
    event.preventDefault();

    const subjectName = document.getElementById('chatSubjectSelect').value;
    const message = document.getElementById('subjectChatMessage').value.trim();

    if (!subjectName || !message) {
        showStatus('subjectChatStatus', 'Please select a subject and enter a message', 'warning');
        return;
    }

    try {
        showStatus('subjectChatStatus', 'Sending message...', 'info');

        const sendSubjectMessage = functions.httpsCallable('sendSubjectMessage');
        const result = await sendSubjectMessage({
            semesterId: currentSemesterId,
            subjectName: subjectName,
            message: message,
        });

        if (result.data.success) {
            showStatus('subjectChatStatus', '✓ Message sent to subject group.', 'success');
            document.getElementById('subjectChatMessage').value = '';
        } else {
            showStatus('subjectChatStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('subjectChatStatus', `Failed: ${error.message}`, 'error');
    }
}

async function loadMessageRequests() {
    try {
        showStatus('messageRequestsStatus', 'Loading requests...', 'info');

        db.collection('semesters').doc(currentSemesterId)
            .collection('faculty').doc(currentFacultyId)
            .collection('message_requests')
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                const listDiv = document.getElementById('messageRequestsList');
                listDiv.innerHTML = '';

                if (snapshot.empty) {
                    listDiv.innerHTML = '<p class="empty-message">No pending requests.</p>';
                    showStatus('messageRequestsStatus', 'No requests', 'info');
                    return;
                }

                snapshot.forEach(doc => {
                    const req = doc.data();
                    const item = document.createElement('div');
                    item.className = 'notification-item';
                    const time = req.timestamp ? new Date(req.timestamp.toDate()).toLocaleString() : '--';

                    item.innerHTML = `
                        <div class="notification-header">
                            <strong>📩 From: ${req.senderName}</strong>
                            <small>${time}</small>
                        </div>
                        <div class="notification-body">
                            ${escapeHtml(req.message)}
                        </div>
                        <div class="notification-actions" style="margin-top: 10px;">
                            <button class="primary-btn small" onclick="replyToStudent('${req.senderId}', '${req.senderName}')">Reply</button>
                        </div>
                    `;
                    listDiv.appendChild(item);
                });
                showStatus('messageRequestsStatus', '✓ Updated', 'success');
            });
    } catch (error) {
        showStatus('messageRequestsStatus', `Error: ${error.message}`, 'error');
    }
}

function replyToStudent(studentId, studentName) {
    // For now, we can just alert or open a prompt. 
    // In a full implementation, this could open a direct chat.
    const reply = prompt(`Reply to ${studentName}:`);
    if (reply) {
        alert("Personal replies feature coming soon! For now, use the Subject Chat to address group concerns.");
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// LECTURE HISTORY
// ============================================================================

async function showLectureHistory() {
    if (!currentSemesterId) return;

    try {
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('faculty', '==', currentFacultyId)
            .orderBy('lastModified', 'desc')
            .get();

        const listDiv = document.getElementById('historyList');
        listDiv.innerHTML = '';

        if (lectures.empty) {
            listDiv.innerHTML = '<p>No lecture history.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <tr>
                    <th>Subject</th>
                    <th>Original Time</th>
                    <th>Current Status</th>
                    <th>Reason</th>
                </tr>
            `;

            lectures.forEach(doc => {
                const lecture = doc.data();
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${lecture.subject}</td>
                    <td>${lecture.day} ${lecture.startTime}</td>
                    <td><span class="status-badge ${lecture.status}">${lecture.status}</span></td>
                    <td>${lecture.cancelReason || lecture.originalTime || '--'}</td>
                `;
            });

            listDiv.appendChild(table);
        }

        document.getElementById('historyModal').style.display = 'block';
    } catch (error) {
        showError(`Error loading history: ${error.message}`);
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
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
