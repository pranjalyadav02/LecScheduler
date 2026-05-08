const PROJECT_ID = 'lecscheduler-4e36b';

async function inspect() {
    const studentId = 'ZZoSEdv60dbDroSFeQ1JyaDvhoE2';
    console.log(`🔍 Inspecting Student Data for UID: ${studentId}`);
    
    const profileUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${studentId}`;
    const res = await fetch(profileUrl);
    if (!res.ok) {
        console.log(`❌ Student profile not found in 'users/${studentId}'`);
    } else {
        const data = await res.json();
        console.log('✅ Student Profile Found:', JSON.stringify(data.fields, null, 2));
        
        const semesters = data.fields.semesters;
        if (!semesters || !semesters.arrayValue || !semesters.arrayValue.values) {
            console.log('❌ No semesters found in profile.');
            return;
        }
        
        const semesterId = semesters.arrayValue.values[0].stringValue;
        const section = data.fields.section ? data.fields.section.stringValue : 'A';
        
        console.log(`\n📅 Checking lectures for Semester: ${semesterId}, Section: ${section}`);
        
        const lecturesUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/semesters/${semesterId}/lectures`;
        const lRes = await fetch(lecturesUrl);
        if (!lRes.ok) {
            console.log('❌ Lectures collection not found or empty.');
        } else {
            const lData = await lRes.json();
            const lectures = lData.documents || [];
            console.log(`✅ Total lectures found: ${lectures.length}`);
            
            const matching = lectures.filter(doc => {
                const f = doc.fields;
                return f.section && f.section.stringValue === section && f.status && f.status.stringValue !== 'archived';
            });
            
            console.log(`✅ Lectures matching section ${section}: ${matching.length}`);
            if (matching.length > 0) {
                console.log('Example Lecture:', JSON.stringify(matching[0].fields, null, 2));
            }
        }
    }
}

inspect();
