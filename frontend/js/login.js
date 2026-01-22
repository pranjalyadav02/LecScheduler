// ============================================================================
// LOGIN JAVASCRIPT
// ============================================================================

const { auth, db } = window.firebaseApp;
let selectedRole = 'student';

// ============================================================================
// ROLE SELECTION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Load support contact
    try {
        const settings = await db.collection('admin_settings').doc('config').get();
        if (settings.exists) {
            document.getElementById('supportContact').textContent = 
                settings.data().supportEmail || 'support@institution.edu';
        }
    } catch (error) {
        console.log('Could not load settings');
    }

    // Role button listeners
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;
            switchLoginForm(selectedRole);
        });
    });

    // Check if already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            redirectToDashboard(user.uid);
        }
    });
});

function switchLoginForm(role) {
    document.querySelectorAll('.role-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${role}Form`).classList.add('active');

    // Clear messages
    showStatus('', 'info');
}

// ============================================================================
// LOGIN HANDLER
// ============================================================================

async function handleLogin(event) {
    event.preventDefault();

    try {
        showStatus('Logging in...', 'info');

        if (selectedRole === 'student') {
            await handleStudentLogin();
        } else if (selectedRole === 'faculty') {
            await handleFacultyLogin();
        } else if (selectedRole === 'admin') {
            await handleAdminLogin();
        }
    } catch (error) {
        console.error('Login error:', error);
        handleLoginError(error);
    }
}

// ============================================================================
// STUDENT LOGIN: Enrollment Number + Password
// ============================================================================

async function handleStudentLogin() {
    const enrollmentNo = document.getElementById('enrollmentNo').value;
    const password = document.getElementById('studentPassword').value;

    if (!enrollmentNo || !password) {
        throw new Error('Please enter both enrollment number and password.');
    }

    try {
        // Sign in with Firebase Auth (UID = enrollment number)
        const credential = await auth.signInWithEmailAndPassword(
            `${enrollmentNo}@lec-scheduler.local`,
            password
        );

        // Get user role and semester
        const userDoc = await db.collection('users').doc(credential.user.uid).get();

        if (!userDoc.exists) {
            throw new Error('User data not found. Please contact support.');
        }

        const userData = userDoc.data();

        if (userData.role !== 'student') {
            throw new Error('Access denied. Invalid credentials for student login.');
        }

        // Check if password needs to be changed
        if (!userData.passwordChanged) {
            // Redirect to password change page
            sessionStorage.setItem('needsPasswordChange', 'true');
            window.location.href = 'change-password.html';
        } else {
            // Redirect to student dashboard
            redirectToDashboard(credential.user.uid);
        }
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid enrollment number or password. Check the credentials sent to your phone.');
        }
        throw error;
    }
}

// ============================================================================
// FACULTY LOGIN: Email + Password
// ============================================================================

async function handleFacultyLogin() {
    const email = document.getElementById('facultyEmail').value;
    const password = document.getElementById('facultyPassword').value;

    if (!email || !password) {
        throw new Error('Please enter email and password.');
    }

    try {
        const credential = await auth.signInWithEmailAndPassword(email, password);

        // Verify role
        const userDoc = await db.collection('users').doc(credential.user.uid).get();

        if (!userDoc.exists) {
            throw new Error('Faculty account not found.');
        }

        if (userDoc.data().role !== 'faculty') {
            throw new Error('Access denied. Invalid credentials for faculty login.');
        }

        redirectToDashboard(credential.user.uid);
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
    }
}

// ============================================================================
// ADMIN LOGIN: Email + Password
// ============================================================================

async function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (!email || !password) {
        throw new Error('Please enter email and password.');
    }

    try {
        const credential = await auth.signInWithEmailAndPassword(email, password);

        // Verify role
        const userDoc = await db.collection('users').doc(credential.user.uid).get();

        if (!userDoc.exists) {
            throw new Error('Admin account not found.');
        }

        if (userDoc.data().role !== 'admin') {
            throw new Error('Access denied. Invalid credentials for admin login.');
        }

        redirectToDashboard(credential.user.uid);
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
    }
}

// ============================================================================
// REDIRECT AFTER LOGIN
// ============================================================================

async function redirectToDashboard(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        const role = userDoc.data().role;

        if (role === 'student') {
            window.location.href = 'student.html';
        } else if (role === 'faculty') {
            window.location.href = 'faculty.html';
        } else if (role === 'admin') {
            window.location.href = 'admin.html';
        }
    } catch (error) {
        throw new Error(`Failed to determine user role: ${error.message}`);
    }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function handleLoginError(error) {
    let message = error.message || 'Login failed. Please try again.';

    // Replace Firebase error codes with human-readable messages
    const errorMap = {
        'auth/invalid-email': 'Invalid email format.',
        'auth/weak-password': 'Password is too weak.',
        'auth/account-exists-with-different-credential': 'Account exists with different sign-in method.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/too-many-requests': 'Too many login attempts. Please try again later.',
    };

    if (errorMap[error.code]) {
        message = errorMap[error.code];
    }

    showStatus(message, 'error');
}

// ============================================================================
// UTILITIES
// ============================================================================

function showStatus(message, type) {
    const element = document.getElementById('statusMessage');
    if (message) {
        element.textContent = message;
        element.className = `status-message ${type}`;
    } else {
        element.textContent = '';
        element.className = 'status-message';
    }
}
