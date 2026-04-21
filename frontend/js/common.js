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

// Optionally export other helpers in future