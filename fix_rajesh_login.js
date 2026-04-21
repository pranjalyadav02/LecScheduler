/**
 * Fix Faculty Profile for Dr. Rajesh Verma
 */

const PROJECT_ID = 'lecscheduler-4e36b';
const API_KEY = 'AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc';

async function fixRajeshProfile() {
    const email = 'dr_rajesh_verma@college.ac.in';
    
    console.log(`🔍 Finding UID for ${email}...`);

    // 1. Get UID from email (SignIn with existing password to get localId)
    const signUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const signRes = await fetch(signUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Test@123478', returnSecureToken: true })
    });
    const signData = await signRes.json();

    if (!signRes.ok) {
        console.error('❌ Could not sign in to find UID:', signData.error?.message);
        return;
    }

    const uid = signData.localId;
    console.log(`✅ Found UID: ${uid}`);

    // 2. Create the user profile at users/UID
    const profileUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    
    const profileData = {
        fields: {
            uid: { stringValue: uid },
            email: { stringValue: email },
            displayName: { stringValue: 'Dr. Rajesh Verma' },
            role: { stringValue: 'faculty' },
            status: { stringValue: 'active' },
            semesters: { arrayValue: { values: [
                { stringValue: 'mca_semester_ii' },
                { stringValue: 'mca_semester_iv' }
            ]}}
        }
    };

    console.log(`📝 Creating profile at users/${uid}...`);
    const patchRes = await fetch(profileUrl, {
        method: 'PATCH', // Use PATCH for create or update
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });

    if (patchRes.ok) {
        console.log('✅ PROFILE FIXED! Dr. Rajesh Verma can now log in.');
    } else {
        const err = await patchRes.json();
        console.error('❌ Failed to create profile:', err.error?.message);
    }
}

fixRajeshProfile();
