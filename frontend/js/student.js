// ============================================================================
// STUDENT PORTAL JAVASCRIPT
// ============================================================================

let currentSemesterId = null;
let currentStudentId = null;
let cachedTimetable = [];
const { db, auth } = window.firebaseApp;

// Cache expiry (1 hour)
const CACHE_EXPIRY = 60 * 60 * 1000;

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

            // Load student data
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'student') {
                showError('Unauthorized. Student access required.');
                setTimeout(() => logout(), 2000);
                return;
            }

            document.getElementById('studentName').textContent = user.displayName || 'Student';
            currentStudentId = user.uid;

            // Get semester for this student
            const semesters = userDoc.data().semesters || [];
            if (semesters.length > 0) {
                currentSemesterId = semesters[0];
                await loadSemesterInfo();
                await loadTimetable();
                await loadNotifications();
                await loadChatMessages();
                setupLiveUpdates();
            } else {
                showError('No semester assigned to you.');
            }
        });
    } catch (error) {
        showError(error.message);
    }
});

// ============================================================================
// TAB NAVIGATION
// ============================================================================

function switchTab(tabName, evt) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
    }

    // Refresh data if needed
    if (tabName === 'timetable') loadTimetable();
    if (tabName === 'notifications') loadNotifications();
    if (tabName === 'chat') {
        loadSubjectsForChat();
        loadChatMessages();
    }
}

// ============================================================================
// SEMESTER INFO & SETTINGS
// ============================================================================

async function loadSemesterInfo() {
    try {
        const semesterDoc = await db.collection('semesters').doc(currentSemesterId).get();
        if (semesterDoc.exists) {
            const semester = semesterDoc.data();
            document.getElementById('semesterDisplay').textContent = 
                `Semester: ${semester.name} (${semester.code || 'N/A'})`;
        }

        // Load support contact
        const settings = await db.collection('admin_settings').doc('config').get();
        if (settings.exists) {
            document.getElementById('supportPhone').textContent = 
                settings.data().supportPhone || 'Not available';
        }
    } catch (error) {
        console.error('Error loading semester:', error);
    }
}

// ============================================================================
// TAB 1: TIMETABLE (READ-ONLY)
// ============================================================================

async function loadTimetable() {
    try {
        showStatus('timetableStatus', 'Loading timetable...', 'info');

        // Check cache first
        const cached = localStorage.getItem(`timetable_${currentSemesterId}`);
        const cacheTime = localStorage.getItem(`timetable_${currentSemesterId}_time`);
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_EXPIRY)) {
            cachedTimetable = JSON.parse(cached);
            displayTimetable();
            showStatus('timetableStatus', '✓ Timetable loaded', 'success');
            return;
        }

        // Fetch from Firestore
        const lectures = await db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .where('status', '!=', 'archived')
            .orderBy('status')
            .orderBy('day')
            .orderBy('startTime')
            .get();

        cachedTimetable = [];
        lectures.forEach(doc => {
            cachedTimetable.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        // Cache timetable
        localStorage.setItem(`timetable_${currentSemesterId}`, JSON.stringify(cachedTimetable));
        localStorage.setItem(`timetable_${currentSemesterId}_time`, Date.now().toString());

        displayTimetable();
        showStatus('timetableStatus', '✓ Timetable loaded', 'success');
    } catch (error) {
        showStatus('timetableStatus', `Error loading timetable: ${error.message}`, 'error');
        // Try to load from cache anyway
        const cached = localStorage.getItem(`timetable_${currentSemesterId}`);
        if (cached) {
            cachedTimetable = JSON.parse(cached);
            displayTimetable();
            showStatus('timetableStatus', 'Offline: Showing cached timetable', 'warning');
        }
    }
}

function displayTimetable() {
    const grid = document.getElementById('timetableGrid');
    grid.innerHTML = '';

    // Group by day
    const byDay = {};
    cachedTimetable.forEach(lecture => {
        if (!byDay[lecture.day]) {
            byDay[lecture.day] = [];
        }
        byDay[lecture.day].push(lecture);
    });

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Display by day
    dayOrder.forEach(day => {
        if (byDay[day] && byDay[day].length > 0) {
            const daySection = document.createElement('div');
            daySection.className = 'day-section';
            daySection.innerHTML = `<h3>${day}</h3>`;

            byDay[day].forEach(lecture => {
                const card = document.createElement('div');
                card.className = `lecture-card ${lecture.status}`;
                
                let statusBadge = '';
                if (lecture.status === 'cancelled') {
                    statusBadge = '<span class="badge cancelled">CANCELLED</span>';
                } else if (lecture.status === 'rescheduled') {
                    statusBadge = '<span class="badge rescheduled">RESCHEDULED</span>';
                }

                card.innerHTML = `
                    <div class="lecture-header">
                        <strong>${lecture.subject}</strong>
                        ${statusBadge}
                    </div>
                    <div class="lecture-details">
                        <p><strong>Faculty:</strong> ${lecture.faculty}</p>
                        <p><strong>Time:</strong> ${lecture.startTime} - ${lecture.endTime}</p>
                        <p><strong>Room:</strong> ${lecture.room}</p>
                        ${lecture.originalTime ? `<p><em>Originally: ${lecture.originalTime}</em></p>` : ''}
                        ${lecture.cancelReason ? `<p><em>Reason: ${lecture.cancelReason}</em></p>` : ''}
                    </div>
                `;
                daySection.appendChild(card);
            });

            grid.appendChild(daySection);
        }
    });

    // Update timestamp
    const now = new Date().toLocaleString();
    document.getElementById('lastUpdated').textContent = now;
}

// ============================================================================
// TAB 2: NOTIFICATIONS (READ-ONLY)
// ============================================================================

async function loadNotifications() {
    try {
        showStatus('notificationsStatus', 'Loading notifications...', 'info');

        const notifications = await db.collection('semesters').doc(currentSemesterId)
            .collection('notifications')
            .orderBy('sentAt', 'desc')
            .limit(50)
            .get();

        const listDiv = document.getElementById('notificationsList');
        listDiv.innerHTML = '';

        if (notifications.empty) {
            listDiv.innerHTML = '<p class="empty-message">No notifications yet. Check back soon.</p>';
            showStatus('notificationsStatus', 'No notifications', 'info');
            return;
        }

        notifications.forEach(doc => {
            const notif = doc.data();
            const item = document.createElement('div');
            item.className = 'notification-item';
            
            const timestamp = notif.sentAt ? new Date(notif.sentAt.toDate()).toLocaleString() : '--';
            const icon = getNotificationIcon(notif.type);

            item.innerHTML = `
                <div class="notification-header">
                    <strong>${icon} ${notif.title}</strong>
                    <small>${timestamp}</small>
                </div>
                <div class="notification-body">
                    ${notif.message}
                </div>
                ${notif.type === 'lecture-cancelled' || notif.type === 'lecture-rescheduled' ? 
                  '<p class="notification-hint">Check your timetable for changes.</p>' : ''}
            `;
            listDiv.appendChild(item);
        });

        showStatus('notificationsStatus', '✓ Notifications loaded', 'success');
    } catch (error) {
        showStatus('notificationsStatus', `Error: ${error.message}`, 'error');
    }
}

function getNotificationIcon(type) {
    switch(type) {
        case 'lecture-cancelled': return '❌';
        case 'lecture-rescheduled': return '🔄';
        case 'announcement': return '📢';
        default: return '📬';
    }
}

// ============================================================================
// TAB 3: CHAT (Subject-Based)
// ============================================================================

function loadSubjectsForChat() {
    const select = document.getElementById('chatSubjectSelect');
    if (!select) return;

    // Get unique subjects from cached timetable
    const subjects = [...new Set(cachedTimetable.map(l => l.subject))].sort();

    // Preserve selection if possible
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select Subject --</option>';

    subjects.forEach(subject => {
        const opt = document.createElement('option');
        opt.value = subject;
        opt.textContent = subject;
        if (subject === currentVal) opt.selected = true;
        select.appendChild(opt);
    });
}

function loadChatMessages() {
    const subjectName = document.getElementById('chatSubjectSelect').value;
    const messagesDiv = document.getElementById('chatMessages');

    if (!subjectName) {
        messagesDiv.innerHTML = '<p class="empty-message">Please select a subject to view chat.</p>';
        showStatus('chatStatus', 'No subject selected', 'info');
        return;
    }

    try {
        showStatus('chatStatus', 'Loading chat...', 'info');

        // Listen for messages in real-time
        db.collection('semesters').doc(currentSemesterId)
            .collection('subjects').doc(subjectName)
            .collection('chat')
            .orderBy('timestamp', 'asc')
            .limitToLast(100)
            .onSnapshot(snapshot => {
                messagesDiv.innerHTML = '';
                if (snapshot.empty) {
                    messagesDiv.innerHTML = '<p class="empty-message">No messages yet. Be the first to post!</p>';
                } else {
                    snapshot.forEach(doc => {
                        const msg = doc.data();
                        const item = document.createElement('div');
                        item.className = `chat-message ${msg.senderRole === 'student' ? 'student' : 'staff'}`;
                        
                        const timestamp = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleString() : '--';

                        item.innerHTML = `
                            <div class="message-header">
                                <strong>${msg.senderName}</strong>
                                <span class="message-role">${msg.senderRole}</span>
                                <small>${timestamp}</small>
                            </div>
                            <div class="message-body">${escapeHtml(msg.message)}</div>
                        `;
                        messagesDiv.appendChild(item);
                    });
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
                showStatus('chatStatus', '✓ Chat updated', 'success');
            }, error => {
                showStatus('chatStatus', `Error: ${error.message}`, 'error');
            });

    } catch (error) {
        showStatus('chatStatus', `Error: ${error.message}`, 'error');
    }
}

async function openContactModal() {
    const modal = document.getElementById('contactModal');
    const select = document.getElementById('contactFacultySelect');
    if (!modal || !select) return;

    try {
        select.innerHTML = '<option value="">-- Loading Faculty --</option>';
        modal.style.display = 'block';

        // Fetch faculty for this semester
        const facultyList = await db.collection('users')
            .where('role', '==', 'faculty')
            .where('semesters', 'array-contains', currentSemesterId)
            .get();

        select.innerHTML = '<option value="">-- Select Faculty --</option>';
        facultyList.forEach(doc => {
            const data = doc.data();
            const opt = document.createElement('option');
            opt.value = doc.id;
            opt.textContent = data.displayName || data.name || 'Unknown Faculty';
            select.appendChild(opt);
        });

        if (facultyList.empty) {
            select.innerHTML = '<option value="">No faculty found</option>';
        }
    } catch (error) {
        console.error('Error loading faculty list:', error);
        showStatus('personalMessageStatus', 'Error loading faculty', 'error');
    }
}

function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
}

async function handleSendPersonalMessage(event) {
    event.preventDefault();

    const facultyId = document.getElementById('contactFacultySelect').value;
    const messageText = document.getElementById('personalMessageInput').value.trim();

    if (!facultyId || !messageText) {
        showStatus('personalMessageStatus', 'Please select faculty and enter message', 'warning');
        return;
    }

    try {
        showStatus('personalMessageStatus', 'Sending request...', 'info');

        const sendPersonalMessage = window.firebase.functions().httpsCallable('sendPersonalMessage');
        const result = await sendPersonalMessage({
            semesterId: currentSemesterId,
            facultyId: facultyId,
            message: messageText
        });

        if (result.data.success) {
            showStatus('personalMessageStatus', '✓ Message request sent.', 'success');
            document.getElementById('personalMessageInput').value = '';
            setTimeout(() => {
                closeContactModal();
                showStatus('personalMessageStatus', '', '');
            }, 2000);
        } else {
            showStatus('personalMessageStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('personalMessageStatus', `Failed: ${error.message}`, 'error');
    }
}

async function handleSendMessage(event) {
    event.preventDefault();

    const subjectName = document.getElementById('chatSubjectSelect').value;
    const messageText = document.getElementById('messageInput').value.trim();

    if (!subjectName) {
        showStatus('chatStatus', 'Please select a subject first', 'warning');
        return;
    }

    if (!messageText) {
        showStatus('chatStatus', 'Message cannot be empty', 'warning');
        return;
    }

    try {
        showStatus('chatStatus', 'Sending message...', 'info');

        // Use the new subject-specific Cloud Function
        const sendSubjectMessage = window.firebase.functions().httpsCallable('sendSubjectMessage');
        const result = await sendSubjectMessage({
            semesterId: currentSemesterId,
            subjectName: subjectName,
            message: messageText
        });

        if (result.data.success) {
            document.getElementById('messageInput').value = '';
            showStatus('chatStatus', '✓ Message sent', 'success');
        } else {
            showStatus('chatStatus', `Error: ${result.data.message}`, 'error');
        }
    } catch (error) {
        showStatus('chatStatus', `Failed to send: ${error.message}`, 'error');
    }
}

// ============================================================================
// LIVE UPDATES (Real-time listeners)
// ============================================================================

function setupLiveUpdates() {
    // Listen for notification changes
    try {
        db.collection('semesters').doc(currentSemesterId)
            .collection('notifications')
            .orderBy('sentAt', 'desc')
            .limit(5)
            .onSnapshot(() => {
                // Refresh if in notifications tab
                if (document.getElementById('notifications').classList.contains('active')) {
                    loadNotifications();
                }
            });
    } catch (error) {
        console.log('Could not setup live notifications:', error);
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
