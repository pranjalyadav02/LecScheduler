const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🔍 STARTING INSTITUTIONAL CONSOLE AUDIT...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function auditPortal(name, role, user, pass) {
        console.log(`\n📡 Auditing ${name} Portal...`);
        const browser = await puppeteer.launch({ 
            headless: true, 
            executablePath: chromePath 
        });
        const page = await browser.newPage();
        
        const logs = [];
        page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
        page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
        page.on('requestfailed', req => logs.push(`[NET FAIL] ${req.url()}: ${req.failure().errorText}`));

        try {
            await page.goto('http://localhost:8000/pages/login.html');
            await new Promise(r => setTimeout(r, 2000));
            
            // Login logic
            await page.evaluate((r) => {
                const btn = document.querySelector(`[data-role="${r}"]`);
                if(btn) btn.click();
            }, role);
            await new Promise(r => setTimeout(r, 1000));
            
            await page.evaluate((r, u, p) => {
                if (r === 'admin') { document.getElementById('adminEmail').value = u; document.getElementById('adminPassword').value = p; }
                if (r === 'faculty') { document.getElementById('facultyEmail').value = u; document.getElementById('facultyPassword').value = p; }
                if (r === 'student') { document.getElementById('enrollmentNo').value = u; document.getElementById('studentPassword').value = p; }
                const form = document.getElementById(r + 'Form');
                if(form) form.querySelector('button[type="submit"]').click();
            }, role, user, pass);

            await new Promise(r => setTimeout(r, 10000)); // wait for firebase/data
            
            console.log(`--- CONSOLE LOGS FOR ${name.toUpperCase()} ---`);
            if (logs.length === 0) {
                console.log('✅ No errors discovered.');
            } else {
                logs.forEach(log => {
                    const color = log.includes('error') || log.includes('ERROR') || log.includes('FAIL') ? '❌' : 'ℹ️';
                    console.log(`${color} ${log}`);
                });
            }
        } catch (e) {
            console.log(`❌ Audit failed for ${name}: ${e.message}`);
        }
        await browser.close();
    }

    await auditPortal('Admin', 'admin', 'admin@institution.edu', 'Admin@123456');
    await auditPortal('Faculty', 'faculty', 'dr_rajesh_verma@college.ac.in', 'Test@123478');
    await auditPortal('Student', 'student', 'MCA2026001', 'Default@1234');

    console.log('\n🏁 CONSOLE AUDIT FINISHED.');
})();
