// ============================================================================
// FACULTY PORTAL JAVASCRIPT
// ============================================================================

let currentSemesterId = null;
let currentFacultyId = null;
let assignedSemesters = [];
// Firebase services are available as window.auth, window.db, window.storage, window.functions

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = '/pages/login.html';
                return;
            }

            // Load faculty data
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'faculty') {
                showError('Unauthorized. Faculty access required.');
                setTimeout(() => logout(), 2000);
                return;
            }

            document.getElementById('facultyName').textContent = userDoc.data().displayName || user.displayName || 'Faculty';
            // Use the facultyId slug from the user doc
            currentFacultyId = userDoc.data().facultyId || userDoc.data().displayName?.toLowerCase().replace(/[\s.]+/g, '_').replace(/[^a-z_]/g, '') || user.uid;

            assignedSemesters = userDoc.data().semesters || [];
            if (assignedSemesters.length > 0) {
                // Populate Dashboard Semester Select
                const dashSem = document.getElementById('dashSemSelect');
                if (dashSem) {
                    dashSem.innerHTML = '';
                    assignedSemesters.forEach(sem => {
                        const opt = document.createElement('option');
                        opt.value = sem;
                        opt.textContent = sem.replace(/_/g, ' ').toUpperCase();
                        dashSem.appendChild(opt);
                    });
                }

                currentSemesterId = assignedSemesters[0];
                await refreshDashboard();
                
                // Keep Chat Semester sync
                const chatSem = document.getElementById('chatSemSelect');
                if (chatSem) {
                    chatSem.innerHTML = dashSem ? dashSem.innerHTML : '';
                    chatSem.value = currentSemesterId;
                    switchChat();
                }
            } else {
                showError('No semester assigned to you.');
                const dashSem = document.getElementById('dashSemSelect');
                if (dashSem) dashSem.innerHTML = '<option value="">None Assigned</option>';
            }
        });
    } catch (error) {
        showError(error.message);
    }
});

// ============================================================================
// SEMESTER & LECTURES
// ============================================================================

async function onDashboardSemesterChange() {
    currentSemesterId = document.getElementById('dashSemSelect').value;
    // Sync with chat select if it exists
    const chatSem = document.getElementById('chatSemSelect');
    if (chatSem) {
        chatSem.value = currentSemesterId;
        switchChat();
    }
    await refreshDashboard();
}

/**
 * Refresh all dashboard components for the current semester.
 */
async function refreshDashboard() {
    if (!currentSemesterId) return;
    
    // Reset section filter when semester changes to avoid "mixing"
    const dashSec = document.getElementById('dashSecSelect');
    if (dashSec) dashSec.value = '';

    await updateTeachingSummary();
    await loadMyLecturesForSelect();
}

async function loadMyLecturesForSelect() {
    try {
        const selectedSec = document.getElementById('dashSecSelect')?.value;
        
        let query = window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('facultyId', '==', currentFacultyId);
        
        if (selectedSec) {
            query = query.where('section', '==', selectedSec);
        }

        const snapshot = await query.get();
        
        // Sort manually by day and time to avoid index requirement
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const lectures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                if (dayDiff !== 0) return dayDiff;
                return (a.startTime || '').localeCompare(b.startTime || '');
            });

        const cancelSelect = document.getElementById('cancelLectureSelect');
        const rescheduleSelect = document.getElementById('rescheduleLectureSelect');

        cancelSelect.innerHTML = '<option value="">-- Select Lecture --</option>';
        rescheduleSelect.innerHTML = '<option value="">-- Select Lecture --</option>';

        lectures.forEach(lecture => {
            const sectionStr = lecture.section ? `[Sec ${lecture.section}]` : '';
            const statusStr = lecture.status === 'cancelled' ? ' (CANCELLED)' : '';
            const optionText = `${lecture.subject} ${sectionStr} - ${lecture.day} ${lecture.startTime} (${lecture.room})${statusStr}`;
            
            // Only show scheduled lectures in the cancel dropdown
            if (lecture.status === 'scheduled') {
                const opt1 = document.createElement('option');
                opt1.value = lecture.id;
                opt1.textContent = optionText;
                cancelSelect.appendChild(opt1);
            }

            // Show both scheduled and cancelled lectures in the reschedule dropdown
            if (lecture.status === 'scheduled' || lecture.status === 'cancelled') {
                const opt2 = document.createElement('option');
                opt2.value = lecture.id;
                opt2.textContent = optionText;
                rescheduleSelect.appendChild(opt2);
            }
        });
    } catch (error) {
        console.error('Error loading lectures:', error);
    }
}

async function showMyLectures() {
    if (!currentSemesterId) return;

    try {
        const selectedSec = document.getElementById('dashSecSelect')?.value;
        
        let query = window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('facultyId', '==', currentFacultyId);
        
        if (selectedSec) {
            query = query.where('section', '==', selectedSec);
        }

        const snapshot = await query.get();

        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const lectures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                if (dayDiff !== 0) return dayDiff;
                return (a.startTime || '').localeCompare(b.startTime || '');
            });

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
                    <th>Sec</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Status</th>
                </tr>
            `;

            lectures.forEach(lecture => {
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${lecture.subject}</td>
                    <td style="text-align:center"><strong>${lecture.section || '--'}</strong></td>
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
// FACULTY ACTIONS
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
        const facultyName = document.getElementById('facultyName').textContent;
        
        const batch = window.db.batch();
        const lectureRef = window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures').doc(lectureId);
        
        batch.update(lectureRef, {
            status: 'cancelled',
            cancelReason: reason || 'No reason provided',
            lastModified: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        const notifRef = window.db.collection('semesters').doc(currentSemesterId)
            .collection('notifications').doc();
        
        batch.set(notifRef, {
            type: 'lecture-cancelled',
            title: 'Lecture Cancelled',
            message: `A lecture has been cancelled. Check the timetable for details.`,
            affectedLectures: [lectureId],
            fromName: facultyName,
            sentAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        showStatus('cancelStatus', '✓ Lecture cancelled. Students notified.', 'success');
        document.getElementById('cancelReason').value = '';
        await loadMyLecturesForSelect();
    } catch (error) {
        showStatus('cancelStatus', `Failed: ${error.message}`, 'error');
    }
}

async function handleRescheduleLecture(event) {
    event.preventDefault();
    const lectureId = document.getElementById('rescheduleLectureSelect').value;
    const newDateStr = document.getElementById('newDate').value;
    const newStartTime = document.getElementById('newStartTime').value;
    const newEndTime = document.getElementById('newEndTime').value;

    if (!lectureId || !newDateStr || !newStartTime || !newEndTime) {
        showStatus('rescheduleStatus', 'Please fill all fields', 'warning');
        return;
    }

    const dateObj = new Date(newDateStr);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const newDay = dayNames[dateObj.getDay()];

    try {
        showStatus('rescheduleStatus', 'Checking availability...', 'info');

        // 1. Get original lecture info
        const docSnap = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures').doc(lectureId).get();
        if (!docSnap.exists) throw new Error('Lecture not found.');
        const original = docSnap.data();

        // 2. Local collision check (optional but faster for user)
        const isBusy = await checkSlotAvailability(newDay, newStartTime, newEndTime, original.section, original.room, lectureId);
        if (isBusy) {
            showStatus('rescheduleStatus', `Slot occupied: ${isBusy}. Choose another time/day.`, 'error');
            return;
        }

        showStatus('rescheduleStatus', 'Rescheduling lecture...', 'info');
        const facultyName = document.getElementById('facultyName').textContent;

        const batch = window.db.batch();
        const lectureRef = window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures').doc(lectureId);

        const updateData = {
            day: newDay,
            startTime: newStartTime,
            endTime: newEndTime,
            status: 'rescheduled',
            lastModified: window.firebase.firestore.FieldValue.serverTimestamp()
        };
        if (newDateStr) updateData.date = newDateStr;
        
        batch.update(lectureRef, updateData);

        const notifRef = window.db.collection('semesters').doc(currentSemesterId)
            .collection('notifications').doc();
            
        batch.set(notifRef, {
            type: 'lecture-rescheduled',
            title: 'Lecture Time Changed',
            message: `A lecture has been rescheduled. Check timetable for new time.`,
            affectedLectures: [lectureId],
            fromName: facultyName,
            sentAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        showStatus('rescheduleStatus', '✓ Lecture rescheduled. Students notified.', 'success');
        document.getElementById('newDate').value = '';
        document.getElementById('newStartTime').value = '';
        document.getElementById('newEndTime').value = '';
        await loadMyLecturesForSelect();
    } catch (error) {
        showStatus('rescheduleStatus', `Failed: ${error.message}`, 'error');
    }
}

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
        const facultyName = document.getElementById('facultyName').textContent;
        
        const announcementData = {
            type: 'announcement',
            title: title || 'New Announcement',
            message: message,
            fromName: facultyName,
            sentAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        };

        await window.db.collection('semesters').doc(currentSemesterId)
            .collection('notifications').add(announcementData);

        showStatus('facultyAnnouncementStatus', '✓ Announcement sent.', 'success');
        document.getElementById('facultyAnnouncementTitle').value = '';
        document.getElementById('facultyAnnouncementMsg').value = '';
    } catch (error) {
        showStatus('facultyAnnouncementStatus', `Failed: ${error.message}`, 'error');
    }
}

async function showLectureHistory() {
    if (!currentSemesterId) return;

    try {
        const snapshot = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('facultyId', '==', currentFacultyId)
            .get();

        const lectures = snapshot.docs.map(doc => doc.data())
            .sort((a, b) => (b.lastModified?.toDate() || 0) - (a.lastModified?.toDate() || 0));

        const listDiv = document.getElementById('historyList');
        listDiv.innerHTML = '';

        if (lectures.empty) {
            listDiv.innerHTML = '<p>No lecture history.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `<tr><th>Subject</th><th>Original Time</th><th>Status</th><th>Reason</th></tr>`;
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
// CHAT LOGIC
// ============================================================================

async function switchChat() {
    const semId = document.getElementById('chatSemSelect').value;
    const section = document.getElementById('chatSecSelect').value;
    if (!semId) return;
    if (typeof initChat === 'function') initChat(semId, section, 'chatMessages');
}

function openGroupChatView() {
    const chatView = document.getElementById('groupChatView');
    if (chatView) chatView.classList.remove('hidden');
}

function closeGroupChatView() {
    const chatView = document.getElementById('groupChatView');
    if (chatView) chatView.classList.add('hidden');
}

async function handleChatSubmit(e) {
    if (e) e.preventDefault();
    const semId = document.getElementById('chatSemSelect').value;
    const section = document.getElementById('chatSecSelect').value;
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!semId || !msg) return;

    try {
        const facultyName = document.getElementById('facultyName').textContent;
        await sendMessage(semId, section, msg, window.auth.currentUser.uid, facultyName);
        input.value = '';
    } catch (err) {
        showError('Failed to send: ' + err.message);
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

async function updateTeachingSummary() {
    const summaryDiv = document.getElementById('facultySummary');
    if (!summaryDiv) return;
    summaryDiv.innerHTML = '<small>Updating load...</small>';

    try {
        const lectures = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('facultyId', '==', currentFacultyId)
            .get();

        const subjects = {};
        lectures.forEach(doc => {
            const data = doc.data();
            const key = `${data.subject} (${data.section})`;
            subjects[key] = true;
        });

        const subjectList = Object.keys(subjects);
        if (subjectList.length > 0) {
            summaryDiv.innerHTML = `<div class="teaching-load"><strong>Teaching:</strong> ${subjectList.join(', ')}</div>`;
        } else {
            summaryDiv.innerHTML = '<div class="teaching-load">No classes this semester.</div>';
        }
    } catch (e) {
        console.error('Summary error:', e);
    }
}

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
    window.auth.signOut().then(() => {
        window.location.href = '/pages/login.html';
    }).catch(error => showError(error.message));
}
/**
 * Check if a slot is available (no collisions for this section or this room).
 */
async function checkSlotAvailability(day, start, end, section, room, excludeId) {
    try {
        const snapshot = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('day', '==', day)
            .get();

        const collision = snapshot.docs.find(doc => {
            const l = doc.data();
            if (doc.id === excludeId) return false;
            if (l.status !== 'scheduled') return false;
            
            // Check if section or room is same
            const sameGroup = (l.section === section || l.room === room);
            if (!sameGroup) return false;

            // Check if times overlap
            return timesOverlap(start, end, l.startTime, l.endTime);
        });

        if (collision) {
            const l = collision.data();
            return `${l.subject} (${l.startTime}-${l.endTime}) in ${l.room}`;
        }
    } catch (e) {
        console.error('Availability check failed:', e);
    }
    return null;
}

function timesOverlap(s1, e1, s2, e2) {
    const toMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
}
