const API_KEY = 'AIzaSyDraOcEe3NMokWlhPtEQyXi8vg09MsZjMc';

async function getFacultyUid() {
    const email = 'dr_rajesh_verma@college.ac.in';
    const password = 'Test@123478'; 
    
    console.log(`📡 Signing in as ${email}...`);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const data = await res.json();
    if (res.ok) {
        console.log(`✅ Success! UID: ${data.localId}`);
    } else {
        console.error('❌ Failed:', data.error?.message);
    }
}

getFacultyUid();
