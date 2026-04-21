/**
 * Create Student Auth for 'Alice Student'
 */

const PROJECT_ID = 'lecscheduler-4e36b';
const BASE_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc`;

async function createAliceAuth() {
    const email = 'mca2026001@lec-scheduler.local';
    const password = 'Default@1234'; 
    const UID = 'MCA2026001';
    
    console.log(`🚀 Creating auth for Alice Student (${email})...`);

    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            returnSecureToken: true
        })
    });

    const data = await res.json();
    const uid = data.localId;
    
    if (res.ok && uid) {
        console.log('✅ Auth account created successfully!');
        console.log(`🔑 Login Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        
        // Update user doc with role student
        const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=email&updateMask.fieldPaths=role&updateMask.fieldPaths=passwordChanged`;
        await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    email: { stringValue: email },
                    role: { stringValue: 'student' },
                    passwordChanged: { booleanValue: true } // Bypass change password screen for this test
                }
            })
        });
        console.log('✅ Firestore profile updated.');

    } else {
        if (data.error?.message === 'EMAIL_EXISTS') {
            console.log('ℹ️ Account already exists. Attempting sign-in to get UID to map role...');
            const signRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, returnSecureToken: true })
            });
            const signData = await signRes.json();
            if (signRes.ok && signData.localId) {
                const uid = signData.localId;
                const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=email&updateMask.fieldPaths=role&updateMask.fieldPaths=passwordChanged`;
                await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fields: {
                            email: { stringValue: email },
                            role: { stringValue: 'student' },
                            passwordChanged: { booleanValue: true }
                        }
                    })
                });
                console.log('✅ Firestore profile updated for existing user.');
            }
        } else {
            console.error('❌ Failed:', data.error?.message);
        }
    }
}

createAliceAuth();
