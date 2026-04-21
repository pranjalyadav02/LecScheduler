const PROJECT_ID = 'lecscheduler-4e36b';
const API_KEY = 'AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc';

async function migrate() {
    console.log('🔑 Logging in as Admin...');
    const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@institution.edu', password: 'Admin@123456', returnSecureToken: true })
    });
    const { idToken } = await loginRes.json();
    if (!idToken) { console.log('❌ Auth failed.'); return; }

    console.log('📡 Fetching all faculty accounts for migration...');
    
    // We need correct UIDs for specific users like Rajesh Verma
    const usersToMigrate = [
        { email: 'dr_rajesh_verma@college.ac.in', pass: 'Test@123478' },
        { email: 'anuradha.savita@college.ac.in', pass: 'Test@123478' },
        { email: 'kirti.vijayvergia@college.ac.in', pass: 'Test@123478' },
        { email: 'ragini.modi@college.ac.in', pass: 'Test@123478' },
        { email: 'shraddha.soni@college.ac.in', pass: 'Test@123478' },
        { email: 'sonal.shrivas@college.ac.in', pass: 'Test@123478' }
    ];

    for (const u of usersToMigrate) {
        process.stdout.write(`🔄 Migrating ${u.email}...`);
        
        // 1. Get real UID from Auth
        const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email, password: u.pass, returnSecureToken: true })
        });
        const authData = await authRes.json();
        if (!authRes.ok) { console.log(' skip (auth error)'); continue; }
        const uid = authData.localId;

        // 2. Find their profile doc (likely named by slug)
        // We'll normalize the email to find the slug
        const slug = u.email.split('@')[0].replace(/\./g, '_');
        
        const docRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${slug}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        
        if (!docRes.ok) {
            console.log(' skip (no slug doc found)'); continue;
        }
        
        const docData = await docRes.json();

        // 3. Create NEW doc with UID as ID
        const newDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
        await fetch(newDocUrl, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: docData.fields })
        });

        // 4. Update the UID field inside the doc
        await fetch(newDocUrl + '?updateMask.fieldPaths=uid', {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { uid: { stringValue: uid } } })
        });

        console.log(` done (UID: ${uid})`);
    }

    console.log('✅ PROFILE MIGRATION COMPLETE!');
}

migrate();
