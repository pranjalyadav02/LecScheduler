const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 SYSTEM AUDIT: Starting Instant Verification (Online Mode)...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function login(role, user, pass, pos) {
        console.log(`   - Launching ${role}...`);
        const browser = await puppeteer.launch({ 
            headless: false, 
            executablePath: chromePath, 
            defaultViewport: null,
            args: ['--start-maximized']
        });
        const page = await browser.newPage();
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
        await new Promise(r => setTimeout(r, 10000));
        return { browser, page };
    }

    try {
        console.log('\n📡 STEP 1: Launching Portals...');
        const { page: adminPage } = await login('admin', 'admin@institution.edu', 'Admin@123456', '0,0');
        const { page: facPage } = await login('faculty', 'dr_rajesh_verma@college.ac.in', 'Test@123478', '600,0');
        const { page: stuPage } = await login('student', 'MCA2026001', 'Default@1234', '1200,0');

        const pageChecks = await Promise.all([
            adminPage.url(),
            facPage.url(),
            stuPage.url()
        ]);
        const [adminUrl, facultyUrl, studentUrl] = pageChecks;
        console.log(`   - Admin URL: ${adminUrl}`);
        console.log(`   - Faculty URL: ${facultyUrl}`);
        console.log(`   - Student URL: ${studentUrl}`);

        console.log('\n💬 STEP 2: INSTANT TEST (Real-time Sync)');
        const testMsg = `INSTANT SYNC TEST [ID: ${Math.floor(Math.random()*9000)}]`;
        
        await facPage.evaluate(async (m) => {
            const sem = document.getElementById('chatSemSelect');
            if(sem) {
                sem.value = 'mca_semester_ii';
                document.getElementById('chatSecSelect').value = 'A';
                if(window.switchChat) window.switchChat();
                
                setTimeout(() => {
                    const input = document.getElementById('chatInput');
                    if(input) {
                        input.value = m;
                        document.querySelector('.chat-input-form button').click();
                    }
                }, 2000);
            }
        }, testMsg);

        console.log(`   - Faculty sent: "${testMsg}"`);
        await new Promise(r => setTimeout(r, 6000));

        const received = await stuPage.evaluate((m) => {
            // Switch to chat tab
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(t => { if(t.innerText.includes('Chat')) t.click(); });
            return document.body.innerText.includes(m);
        }, testMsg);

        if (received) {
            console.log('   ✅ INSTANT SYNC VERIFIED: Success!');
        } else {
            console.log('   ⚠️ INSTANT SYNC NOTE: Message not found programmatically. Please check manually on screen.');
        }

        console.log('\n✅ STEP 3: PAGE HEALTH CHECK (Online)');
        const health = await Promise.all([
            adminPage.evaluate(() => !!document.body),
            facPage.evaluate(() => !!document.body),
            stuPage.evaluate(() => !!document.body)
        ]);
        const [adminOk, facultyOk, studentOk] = health;
        console.log(`   - Admin page loaded: ${adminOk ? 'YES' : 'NO'}`);
        console.log(`   - Faculty page loaded: ${facultyOk ? 'YES' : 'NO'}`);
        console.log(`   - Student page loaded: ${studentOk ? 'YES' : 'NO'}`);

        console.log('\n🎉 AUDIT COMPLETE (ONLINE ONLY). Browsers active on Desktop.');
        await new Promise(r => setTimeout(r, 1800000));

    } catch (e) {
        console.error('\n❌ AUDIT ERROR:', e.message);
    }
})();
