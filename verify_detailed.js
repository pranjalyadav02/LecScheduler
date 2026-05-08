const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 SYSTEM AUDIT: Starting Detailed Headless Verification...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function login(role, user, pass) {
        console.log(`   - Logging in as ${role}...`);
        const browser = await puppeteer.launch({ 
            headless: true, 
            executablePath: chromePath 
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log(`[BROWSER ${role.toUpperCase()}] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.log(`[BROWSER ERROR ${role.toUpperCase()}] ${err.message}`));

        try {
            await page.goto('http://localhost:8000/pages/login.html');
            await new Promise(r => setTimeout(r, 4000));
            
            await page.evaluate((r) => {
                const btn = document.querySelector(`[data-role="${r}"]`);
                if(btn) btn.click();
            }, role);
            await new Promise(r => setTimeout(r, 2000));
            
            await page.evaluate((r, u, p) => {
                if (r === 'admin') { document.getElementById('adminEmail').value = u; document.getElementById('adminPassword').value = p; }
                if (r === 'faculty') { document.getElementById('facultyEmail').value = u; document.getElementById('facultyPassword').value = p; }
                if (r === 'student') { document.getElementById('enrollmentNo').value = u; document.getElementById('studentPassword').value = p; }
            }, role, user, pass);
            
            await page.evaluate((r) => {
                const form = document.getElementById(r + 'Form');
                if(form) form.querySelector('button[type="submit"]').click();
            }, role);
            
            await new Promise(r => setTimeout(r, 15000)); // Wait longer
            
            const url = await page.url();
            return { browser, page, url };
        } catch (e) {
            console.error(`   ❌ Failed: ${e.message}`);
            if (browser) await browser.close();
            return null;
        }
    }

    try {
        const studentResult = await login('student', 'MCA2026001', 'Default@1234');
        if (studentResult) {
            console.log(`   - Student URL: ${studentResult.url}`);
            
            // Check content of timetableGrid
            const gridInfo = await studentResult.page.evaluate(() => {
                const grid = document.getElementById('timetableGrid');
                return {
                    html: grid ? grid.innerHTML : 'NULL',
                    visible: grid ? grid.offsetParent !== null : false,
                    length: grid ? grid.innerHTML.length : 0
                };
            });
            
            console.log(`   - Student Timetable Info: length=${gridInfo.length}, visible=${gridInfo.visible}`);
            if (gridInfo.length < 100) {
                console.log(`   - Grid HTML: ${gridInfo.html}`);
            }
            
            await studentResult.browser.close();
        }

        console.log('\n✅ DETAILED VERIFICATION COMPLETE.');

    } catch (e) {
        console.error('\n❌ AUDIT ERROR:', e.message);
    }
})();
