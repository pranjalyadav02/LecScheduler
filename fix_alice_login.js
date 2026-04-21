/**
 * Fix Student Profile for Alice
 */

const PROJECT_ID = 'lecscheduler-4e36b';
const API_KEY = 'AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc';

async function fixAliceProfile() {
    const email = 'mca2026001@lec-scheduler.local';
    
    console.log(`🔍 Finding UID for Student Alice...`);

    const signUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const signRes = await fetch(signUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Default@1234', returnSecureToken: true })
    });
    const signData = await signRes.json();

    if (!signRes.ok) {
        console.error('❌ Could not find Alice:', signData.error?.message);
        return;
    }

    const uid = signData.localId;
    console.log(`✅ Found UID: ${uid}`);

    const profileUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    
    const profileData = {
        fields: {
            uid: { stringValue: uid },
            email: { stringValue: email },
            displayName: { stringValue: 'Alice Student' },
            role: { stringValue: 'student' },
            enrollmentNo: { stringValue: 'MCA2026001' },
            section: { stringValue: 'A' },
            passwordChanged: { booleanValue: true },
            semesters: { arrayValue: { values: [
                { stringValue: 'mca_semester_ii' }
            ]}}
        }
    };

    console.log(`📝 Creating profile at users/${uid}...`);
    await fetch(profileUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });
    console.log('✅ ALICE PROFILE FIXED!');
}

fixAliceProfile();
