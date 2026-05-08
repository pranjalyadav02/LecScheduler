const PROJECT_ID = 'lecscheduler-4e36b';

async function inspectFaculty() {
    const uid = '3gCO1GXpilN38G6M4BmRskQF3dB2';
    console.log(`🔍 Inspecting Faculty Profile for UID: ${uid}`);
    
    const profileUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const res = await fetch(profileUrl);
    if (!res.ok) {
        console.log(`❌ Faculty profile not found in 'users/${uid}'`);
    } else {
        const data = await res.json();
        console.log('✅ Faculty Profile Found:', JSON.stringify(data.fields, null, 2));
        
        const facultyId = data.fields.facultyId.stringValue;
        const semesters = data.fields.semesters.arrayValue.values.map(v => v.stringValue);
        
        console.log(`\n📅 Faculty ID: ${facultyId}`);
        console.log(`📅 Assigned Semesters: ${semesters.join(', ')}`);
        
        for (const semesterId of semesters) {
            console.log(`\n--- Checking lectures for ${semesterId} ---`);
            const lecturesUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/semesters/${semesterId}/lectures`;
            const lRes = await fetch(lecturesUrl);
            if (!lRes.ok) {
                console.log(`❌ Lectures collection for ${semesterId} not found.`);
            } else {
                const lData = await lRes.json();
                const lectures = lData.documents || [];
                const matching = lectures.filter(doc => {
                    const f = doc.fields;
                    return f.facultyId && f.facultyId.stringValue === facultyId;
                });
                console.log(`✅ Total lectures for faculty in this semester: ${matching.length}`);
                if (matching.length > 0) {
                    console.log('Example Lecture:', JSON.stringify(matching[0].fields, null, 2));
                }
            }
        }
    }
}

inspectFaculty();
