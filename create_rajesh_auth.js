/**
 * Create Faculty Auth for 'Dr. Rajesh Verma'
 */

const PROJECT_ID = 'lecscheduler-4e36b';
const BASE_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc`;

async function createRajeshAuth() {
    const email = 'dr_rajesh_verma@college.ac.in';
    const password = 'Test@123478'; // Secure test password
    
    console.log(`🚀 Creating auth for Dr. Rajesh Verma (${email})...`);

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
    
    if (res.ok) {
        console.log('✅ Auth account created successfully!');
        console.log(`🔑 Login Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        
        // Update user doc with full name
        const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/dr_rajesh_verma?updateMask.fieldPaths=email&updateMask.fieldPaths=displayName`;
        await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    email: { stringValue: email },
                    displayName: { stringValue: 'Dr. Rajesh Verma' }
                }
            })
        });
        console.log('✅ Firestore profile updated.');

    } else {
        if (data.error?.message === 'EMAIL_EXISTS') {
            console.log('ℹ️ Account already exists. Use the credentials below.');
            console.log(`🔑 Login Email: ${email}`);
            console.log(`🔑 Password: ${password} (or existing)`);
        } else {
            console.error('❌ Failed:', data.error?.message);
        }
    }
}

createRajeshAuth();
