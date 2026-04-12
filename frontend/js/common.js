// ============================================================================
// COMMON UTILITIES FOR FRONTEND PAGES
// Shared helpers, status messages, logout, etc.
// ============================================================================

// The firebase-config.js script sets window.firebaseApp with { auth, db, storage, functions }
const { auth, db, storage, functions } = window.firebaseApp || {};

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
    if (!auth) {
        window.location.href = 'login.html';
        return;
    }
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch(showError);
}

// Expose globally
window.showStatus = showStatus;
window.showError = showError;
window.logout = logout;

// Optionally export other helpers in future
```