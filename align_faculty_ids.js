const PROJECT_ID = 'lecscheduler-4e36b';
const API_KEY = 'AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc';

async function align() {
    const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@institution.edu', password: 'Admin@123456', returnSecureToken: true })
    });
    const { idToken } = await loginRes.json();

    const usersRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
    });
    const users = await usersRes.json();

    for (const doc of users.documents || []) {
        const data = doc.fields;
        if (!data || data.role?.stringValue !== 'faculty') continue;

        const name = data.name?.stringValue || '';
        const normalized = name.replace(/^(dr|mr|ms|mrs)\.?\s+/i, '').toLowerCase().replace(/[\s.]+/g, '_').replace(/[^a-z_]/g, '');
        
        console.log(`Aligning ${name} -> ${normalized}`);

        // Update the facultyId field and the UID (though UID is the doc name)
        const updateUrl = `https://firestore.googleapis.com/v1/${doc.name}?updateMask.fieldPaths=facultyId`;
        await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    facultyId: { stringValue: normalized }
                }
            })
        });
    }
    console.log('✅ IDs Aligned!');
}

align();
