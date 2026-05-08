// ============================================================================
// COMMON UTILITIES FOR FRONTEND PAGES
// Shared helpers, status messages, logout, etc.
// ============================================================================

// Firebase services are exposed as window.auth, window.db, window.storage, window.functions
// They are initialized by firebase-config.js which loads before this file

/**
 * Show a status message in the page.
 * Usage:
 *   showStatus("someElementId", "message", "info");
 *   showStatus("message only", "error");       // defaults to #statusMessage
 */
function showStatus(elementId, message, type) {
    if (arguments.length === 2) {
        // called without elementId, shift arguments
        type = message;
        message = elementId;
        elementId = 'statusMessage';
    }

    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`showStatus: element '${elementId}' not found`);
        return;
    }

    element.textContent = message;
    element.className = `status-message ${type}`;
}

/**
 * Log and alert an error message.  Accepts Error objects as well.
 */
function showError(message) {
    console.error(message);
    const text = message && message.message ? message.message : message;
    alert('Error: ' + text);
}

/**
 * Sign the current user out and send them to login page.
 */
function logout() {
    if (!window.auth) {
        window.location.href = '/pages/login.html';
        return;
    }
    window.auth.signOut().then(() => {
        window.location.href = '/pages/login.html';
    }).catch(showError);
}

// Expose globally
window.showStatus = showStatus;
window.showError = showError;
window.logout = logout;

/**
 * Initialize a live clock in the element with id 'liveClock'
 */
function startClock() {
    const clockElement = document.getElementById('liveClock');
    if (!clockElement) return;

    function updateClock() {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        };
        clockElement.textContent = now.toLocaleString('en-US', options);
    }

    updateClock();
    setInterval(updateClock, 1000);
}

window.startClock = startClock;

// Run clock if element exists
document.addEventListener('DOMContentLoaded', startClock);