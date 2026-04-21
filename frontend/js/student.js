// ============================================================================
// STUDENT PORTAL JAVASCRIPT
// ============================================================================

let currentSemesterId = null;
let currentSection = 'A';
let currentStudentId = null;
let cachedTimetable = [];
let currentTimetableView = 'grid';
// Firebase services are available as window.auth, window.db, window.storage, window.functions

// Cache expiry (1 hour)
const CACHE_EXPIRY = 60 * 60 * 1000;

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

            // Load student data
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'student') {
                showError('Unauthorized. Student access required.');
                setTimeout(() => logout(), 2000);
                return;
            }

            document.getElementById('studentName').textContent = user.displayName || 'Student';
            currentStudentId = user.uid;

            // Get semester and section
            const semesters = userDoc.data().semesters || [];
            currentSection = userDoc.data().section || 'A';
            setupSectionSwitcher(userDoc.data());
            if (semesters.length > 0) {
                currentSemesterId = semesters[0];
                currentTimetableView = window.innerWidth < 768 ? 'list' : 'grid';
                await loadSemesterInfo();
                await loadTimetable();
                await loadNotifications();
                
                // Initialize real-time chat via chat.js
                if(typeof initChat === 'function') {
                    initChat(currentSemesterId, currentSection, 'chatMessages');
                }
                
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
    // Ensure chat is initialized if switching to chat tab
    if (tabName === 'chat' && typeof initChat === 'function') {
        initChat(currentSemesterId, currentSection, 'chatMessages');
    }
}

// ============================================================================
// SEMESTER INFO & SETTINGS
// ============================================================================

async function loadSemesterInfo() {
    try {
        const semesterDoc = await window.db.collection('semesters').doc(currentSemesterId).get();
        if (semesterDoc.exists) {
            const semester = semesterDoc.data();
            document.getElementById('semesterDisplay').textContent = 
                `Semester: ${semester.name} (${semester.code || 'N/A'})`;
        }

        // Load support contact
        const settings = await window.db.collection('admin_settings').doc('config').get();
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
        const cacheKey = `timetable_${currentSemesterId}_${currentSection}`;
        const cacheTimeKey = `${cacheKey}_time`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheTimeKey);
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_EXPIRY)) {
            cachedTimetable = JSON.parse(cached);
            displayTimetable();
            showStatus('timetableStatus', '✓ Timetable loaded', 'success');
            return;
        }

        // Fetch from Firestore without composite-index-dependent ordering
        const lectures = await window.db.collection('semesters').doc(currentSemesterId)
            .collection('lectures')
            .get();

        cachedTimetable = [];
        lectures.forEach(doc => {
            const data = doc.data();
            if (data.status === 'archived') return;
            if ((data.section || 'A') !== currentSection) return;
            cachedTimetable.push({
                id: doc.id,
                ...data,
            });
        });

        // Cache timetable
        localStorage.setItem(cacheKey, JSON.stringify(cachedTimetable));
        localStorage.setItem(cacheTimeKey, Date.now().toString());

        displayTimetable();
        showStatus('timetableStatus', '✓ Timetable loaded', 'success');
    } catch (error) {
        showStatus('timetableStatus', `Error loading timetable: ${error.message}`, 'error');
        // Try to load from cache anyway
        const cached = localStorage.getItem(`timetable_${currentSemesterId}_${currentSection}`);
        if (cached) {
            cachedTimetable = JSON.parse(cached);
            displayTimetable();
            showStatus('timetableStatus', 'Offline: Showing cached timetable', 'warning');
        }
    }
}

function displayTimetable() {
    const grid = document.getElementById('timetableGrid');
    const meta = document.getElementById('timetableMeta');
    grid.innerHTML = '';
    meta.innerHTML = '';
    updateTimetableViewButtons();

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayRank = new Map(dayOrder.map((day, idx) => [day, idx]));

    if (!cachedTimetable.length) {
        grid.innerHTML = '<p class="empty-message">No lectures available in your timetable.</p>';
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
        return;
    }

    const sortedLectures = [...cachedTimetable]
        .filter(lecture => dayRank.has(lecture.day))
        .sort((a, b) => {
        const dayA = dayRank.has(a.day) ? dayRank.get(a.day) : 999;
        const dayB = dayRank.has(b.day) ? dayRank.get(b.day) : 999;
        if (dayA !== dayB) return dayA - dayB;
        return (a.startTime || '').localeCompare(b.startTime || '');
    });

    const dominantRoom = getDominantRoom(sortedLectures);
    meta.innerHTML = `
        <strong>Section:</strong> ${formatSemesterLabel(currentSemesterId)}-${escapeHtml(currentSection)}
        <span class="meta-separator">|</span>
        <strong>Room:</strong> ${escapeHtml(dominantRoom)}
    `;

    if (currentTimetableView === 'list') {
        grid.appendChild(renderListView(sortedLectures, dayOrder));
    } else {
        grid.appendChild(renderGridView(sortedLectures, dayOrder));
    }

    // Update timestamp
    const now = new Date().toLocaleString();
    document.getElementById('lastUpdated').textContent = now;
}

function setTimetableView(view) {
    currentTimetableView = view === 'list' ? 'list' : 'grid';
    displayTimetable();
}

async function handleSectionChange() {
    const sectionSelect = document.getElementById('sectionSelect');
    if (!sectionSelect) return;
    currentSection = sectionSelect.value || 'A';
    await loadTimetable();
    if (typeof initChat === 'function') {
        initChat(currentSemesterId, currentSection, 'chatMessages');
    }
}

function setupSectionSwitcher(userData) {
    const sectionSelect = document.getElementById('sectionSelect');
    if (!sectionSelect) return;

    const sections = Array.isArray(userData.sections) && userData.sections.length
        ? userData.sections
        : ['A', 'B'];

    sectionSelect.innerHTML = '';
    sections.forEach(section => {
        const opt = document.createElement('option');
        opt.value = section;
        opt.textContent = section;
        sectionSelect.appendChild(opt);
    });

    if (!sections.includes(currentSection)) {
        currentSection = sections[0];
    }
    sectionSelect.value = currentSection;
}

function updateTimetableViewButtons() {
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    if (!gridBtn || !listBtn) return;
    gridBtn.classList.toggle('active', currentTimetableView === 'grid');
    listBtn.classList.toggle('active', currentTimetableView === 'list');
}

function renderGridView(lectures, dayOrder) {
    const container = document.createElement('div');
    container.className = 'timetable-grid-wrap';

    const slots = buildHourlySlots(lectures);
    if (!slots.length) {
        container.innerHTML = '<p class="empty-message">No timetable slots available.</p>';
        return container;
    }

    const table = document.createElement('table');
    table.className = 'data-table timetable-grid-table';

    const head = document.createElement('tr');
    head.innerHTML = '<th>Day</th>' + slots.map(slot => `<th>${slot.label}</th>`).join('');
    table.appendChild(head);

    dayOrder.forEach(day => {
        const row = table.insertRow();
        row.insertCell().outerHTML = `<td class="day-cell">${day}</td>`;

        const dayLectures = lectures.filter(l => l.day === day);
        const conflictMap = detectConflicts(dayLectures);
        const lectureByStart = new Map(dayLectures.map(l => [l.startTime, l]));
        let slotIndex = 0;

        while (slotIndex < slots.length) {
            const slotStart = slots[slotIndex].start;
            const lecture = lectureByStart.get(slotStart);

            if (!lecture) {
                row.insertCell().outerHTML = '<td class="empty-slot">-</td>';
                slotIndex += 1;
                continue;
            }

            const span = Math.max(1, getHourSpan(lecture.startTime, lecture.endTime));
            const cell = row.insertCell();
            cell.colSpan = span;
            cell.className = `slot-cell ${isLabLecture(lecture) ? 'lab-slot' : 'theory-slot'} ${conflictMap.get(lecture.id) ? 'clash-slot' : ''}`;
            cell.innerHTML = `
                <div class="slot-subject">${escapeHtml(lecture.subject || '--')}</div>
                <div class="slot-faculty">(${escapeHtml(shortFacultyName(lecture.faculty || 'NA'))})</div>
                ${span > 1 ? `<div class="slot-time">(${lecture.startTime}-${lecture.endTime})</div>` : ''}
            `;
            slotIndex += span;
        }
    });

    container.appendChild(table);
    return container;
}

function renderListView(lectures, dayOrder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'timetable-list-view';

    dayOrder.forEach(day => {
        const dayLectures = lectures.filter(l => l.day === day);
        const section = document.createElement('div');
        section.className = 'day-list-block';
        section.innerHTML = `<h3>${day}</h3>`;

        if (!dayLectures.length) {
            section.innerHTML += '<p class="empty-slot">-</p>';
        } else {
            dayLectures.forEach(lecture => {
                const item = document.createElement('div');
                const statusClass = detectConflicts(dayLectures).get(lecture.id) ? 'clash-slot' : (isLabLecture(lecture) ? 'lab-slot' : 'theory-slot');
                item.className = `list-item ${statusClass}`;
                item.innerHTML = `
                    <div class="list-time">${lecture.startTime} - ${lecture.endTime}</div>
                    <div class="list-text">
                        <strong>${escapeHtml(lecture.subject || '--')}</strong>
                        <span>(${escapeHtml(shortFacultyName(lecture.faculty || 'NA'))})</span>
                    </div>
                `;
                section.appendChild(item);
            });
        }
        wrapper.appendChild(section);
    });

    return wrapper;
}

function buildHourlySlots(lectures) {
    const starts = lectures.map(l => timeToMinutes(l.startTime)).filter(v => Number.isFinite(v));
    const ends = lectures.map(l => timeToMinutes(l.endTime)).filter(v => Number.isFinite(v));
    if (!starts.length || !ends.length) return [];
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const slots = [];
    for (let t = min; t < max; t += 60) {
        slots.push({ start: minutesToTime(t), label: slotLabel(t, t + 60) });
    }
    return slots;
}

function detectConflicts(dayLectures) {
    const conflicts = new Map();
    const sorted = [...dayLectures].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    for (let i = 0; i < sorted.length - 1; i++) {
        const currentEnd = timeToMinutes(sorted[i].endTime);
        const nextStart = timeToMinutes(sorted[i + 1].startTime);
        if (currentEnd > nextStart) {
            conflicts.set(sorted[i].id, true);
            conflicts.set(sorted[i + 1].id, true);
        }
    }
    return conflicts;
}

function getHourSpan(start, end) {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) return 1;
    return Math.ceil((endMin - startMin) / 60);
}

function isLabLecture(lecture) {
    const subject = (lecture.subject || '').toLowerCase();
    return subject.includes('lab') || (lecture.room || '').toLowerCase() === 'lab';
}

function timeToMinutes(timeText) {
    if (!timeText || !timeText.includes(':')) return NaN;
    const [h, m] = timeText.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const hours = String(Math.floor(mins / 60)).padStart(2, '0');
    const minsPart = String(mins % 60).padStart(2, '0');
    return `${hours}:${minsPart}`;
}

function slotLabel(start, end) {
    return `${to12Hour(start)}-${to12Hour(end)}`;
}

function to12Hour(mins) {
    const h24 = Math.floor(mins / 60);
    const minsPart = mins % 60;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    if (minsPart === 0) return `${h12}${suffix}`;
    return `${h12}:${String(minsPart).padStart(2, '0')}${suffix}`;
}

function shortFacultyName(fullName) {
    const cleaned = (fullName || '').replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim();
    if (!cleaned) return 'NA';
    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) return parts[0];
    const firstInitial = `${parts[0][0]}.`;
    const lastName = parts[parts.length - 1];
    return `${firstInitial} ${lastName}`;
}

function formatSemesterLabel(semesterId) {
    if (!semesterId) return '--';
    if (semesterId.includes('viii')) return 'SEM8';
    if (semesterId.includes('vi')) return 'SEM6';
    if (semesterId.includes('iv')) return 'SEM4';
    if (semesterId.includes('ii')) return 'SEM2';
    const digitMatch = semesterId.match(/\d+/);
    return digitMatch ? `SEM${digitMatch[0]}` : semesterId.toUpperCase();
}

function getDominantRoom(lectures) {
    const roomCounts = {};
    lectures.forEach(l => {
        const room = l.room || 'N/A';
        if (String(room).toLowerCase() === 'lab') return;
        roomCounts[room] = (roomCounts[room] || 0) + 1;
    });
    const rooms = Object.keys(roomCounts);
    if (!rooms.length) return 'Lab';
    return rooms.sort((a, b) => roomCounts[b] - roomCounts[a])[0];
}

// ============================================================================
// TAB 2: NOTIFICATIONS (READ-ONLY)
// ============================================================================

async function loadNotifications() {
    try {
        showStatus('notificationsStatus', 'Loading notifications...', 'info');

        const notifications = await window.db.collection('semesters').doc(currentSemesterId)
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
// TAB 3: CHAT (READ-ONLY for students, limited posting)
// ============================================================================

async function loadChatMessages() {
    console.log("Chat loading handled via chat.js realtime listeners");
}

async function handleSendMessage(event) {
    if (event) event.preventDefault();

    const input = document.getElementById('messageInput');
    const messageText = input.value.trim();
    if (!messageText) return;

    if (messageText.length > 500) {
        showStatus('chatStatus', 'Message too long (max 500 characters)', 'error');
        return;
    }

    try {
        const user = window.auth.currentUser;
        const displayName = user.displayName || document.getElementById('studentName').textContent || 'Student';
        
        // Use unified sendMessage from chat.js
        if(typeof sendMessage === 'function') {
            await sendMessage(currentSemesterId, currentSection, messageText, user.uid, displayName);
            input.value = '';
            showStatus('chatStatus', '✓ Message sent', 'success');
            // No need to loadChatMessages, onSnapshot will render it
        } else {
            showError('Chat module not loaded.');
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
        window.db.collection('semesters').doc(currentSemesterId)
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
    window.auth.signOut().then(() => {
        window.location.href = '/pages/login.html';
    }).catch(error => {
        showError(error.message);
    });
}
