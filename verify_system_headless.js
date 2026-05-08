const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 SYSTEM AUDIT: Starting Headless Verification...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function login(role, user, pass) {
        console.log(`   - Logging in as ${role}...`);
        const browser = await puppeteer.launch({ 
            headless: true, 
            executablePath: chromePath 
        });
        const page = await browser.newPage();
        
        try {
            await page.goto('http://localhost:8000/pages/login.html');
            await new Promise(r => setTimeout(r, 4000));
            
            // Select role
            await page.evaluate((r) => {
                const btn = document.querySelector(`[data-role="${r}"]`);
                if(btn) btn.click();
            }, role);
            await new Promise(r => setTimeout(r, 2000));
            
            // Fill credentials
            await page.evaluate((r, u, p) => {
                if (r === 'admin') { document.getElementById('adminEmail').value = u; document.getElementById('adminPassword').value = p; }
                if (r === 'faculty') { document.getElementById('facultyEmail').value = u; document.getElementById('facultyPassword').value = p; }
                if (r === 'student') { document.getElementById('enrollmentNo').value = u; document.getElementById('studentPassword').value = p; }
            }, role, user, pass);
            
            // Submit
            await page.evaluate((r) => {
                const form = document.getElementById(r + 'Form');
                if(form) form.querySelector('button[type="submit"]').click();
            }, role);
            
            await new Promise(r => setTimeout(r, 10000));
            
            const url = await page.url();
            const content = await page.content();
            const hasError = content.includes('error') || content.includes('Failed');
            
            return { browser, page, url, hasError };
        } catch (e) {
            console.error(`   ❌ Failed to login as ${role}: ${e.message}`);
            await browser.close();
            return null;
        }
    }

    try {
        const adminResult = await login('admin', 'admin@institution.edu', 'Admin@123456');
        if (adminResult) {
            console.log(`   - Admin URL: ${adminResult.url}`);
            console.log(`   - Admin Page Loaded Correctlly: ${adminResult.url.includes('admin.html')}`);
            await adminResult.browser.close();
        }

        const facultyResult = await login('faculty', 'dr_rajesh_verma@college.ac.in', 'Test@123478');
        if (facultyResult) {
            console.log(`   - Faculty URL: ${facultyResult.url}`);
            console.log(`   - Faculty Page Loaded Correctlly: ${facultyResult.url.includes('faculty.html')}`);
            await facultyResult.browser.close();
        }

        const studentResult = await login('student', 'MCA2026001', 'Default@1234');
        if (studentResult) {
            console.log(`   - Student URL: ${studentResult.url}`);
            console.log(`   - Student Page Loaded Correctlly: ${studentResult.url.includes('student.html')}`);
            
            // Check if timetable is visible
            const hasTimetable = await studentResult.page.evaluate(() => {
                return document.getElementById('timetableGrid').innerHTML.length > 100;
            });
            console.log(`   - Student Timetable Visible: ${hasTimetable}`);
            await studentResult.browser.close();
        }

        console.log('\n✅ HEADLESS VERIFICATION COMPLETE.');

    } catch (e) {
        console.error('\n❌ AUDIT ERROR:', e.message);
    }
})();
