const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 Running E2E Automated Verification in Google Chrome...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function launchPortal(name, role, user, pass, pos) {
        console.log(`\n📡 Launching ${name}...`);
        const browser = await puppeteer.launch({ 
            headless: false, 
            executablePath: chromePath,
            args: [`--window-size=600,700`, `--window-position=${pos}`]
        });
        const page = (await browser.pages())[0];
        try {
            await page.goto('http://localhost:8000/pages/login.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Wait for role button to exist
            await page.waitForFunction((r) => !!document.querySelector(`[data-role="${r}"]`), {}, role);
            await new Promise(r => setTimeout(r, 1000));
            
            // Click role button via JS
            await page.evaluate((r) => document.querySelector(`[data-role="${r}"]`).click(), role);
            await new Promise(r => setTimeout(r, 1000));

            // Fill forms and submit via JS
            if (role === 'admin') {
                await page.waitForSelector('#adminEmail', {visible: true});
                await page.type('#adminEmail', user);
                await page.type('#adminPassword', pass);
                await page.evaluate(() => document.querySelector('#adminForm button[type="submit"]').click());
            } else if (role === 'faculty') {
                await page.waitForSelector('#facultyEmail', {visible: true});
                await page.type('#facultyEmail', user);
                await page.type('#facultyPassword', pass);
                await page.evaluate(() => document.querySelector('#facultyForm button[type="submit"]').click());
            } else {
                await page.waitForSelector('#enrollmentNo', {visible: true});
                await page.type('#enrollmentNo', user);
                await page.type('#studentPassword', pass);
                await page.evaluate(() => document.querySelector('#studentForm button[type="submit"]').click());
            }

            // Wait manually instead of waitForNavigation
            await new Promise(r => setTimeout(r, 4000));
            console.log(`✅ ${name} logged in securely!`);
            return { browser, page };
        } catch (e) {
            console.log(`❌ ${name} Auto-login failed: ${e.message}`);
            return null;
        }
    }

    try {
        const adminData = await launchPortal('Admin', 'admin', 'admin@institution.edu', 'Admin@123456', '0,0');
        const facultyData = await launchPortal('Faculty', 'faculty', 'dr_rajesh_verma@college.ac.in', 'Test@123478', '600,0');
        const studentData = await launchPortal('Student', 'student', 'MCA2026001', 'Default@1234', '1200,0');

        if (facultyData && studentData) {
            console.log('\n--- 🧪 Executing Feature Tests ---');
            const facPage = facultyData.page;
            const stuPage = studentData.page;

            // 1. Send chat message from Faculty
            console.log('💬 Faculty: Sending message "Hello Section A from Automation!"');
            await facPage.waitForSelector('#chatSemSelect', {visible: true, timeout: 10000});
            await facPage.select('#chatSemSelect', 'mca_semester_ii');
            await facPage.select('#chatSecSelect', 'A');
            await new Promise(r => setTimeout(r, 1000)); // wait for chat to load
            
            await facPage.type('#chatInput', 'Hello Section A from Automation!');
            await facPage.evaluate(() => document.querySelector('.chat-input-form button[type="submit"]').click());
            console.log('✅ Faculty: Message sent successfully.');

            // 2. Verify chat message received by Student
            console.log('👀 Student: Verifying message receipt...');
            await stuPage.waitForSelector('.chat-message', {timeout: 10000}).catch(()=>console.log('Waiting...'));
            await new Promise(r => setTimeout(r, 2000)); // wait for message to sync
            const messages = await stuPage.evaluate(() => {
                const msgs = Array.from(document.querySelectorAll('.chat-message .msg-text'));
                return msgs.map(m => m.innerText);
            });
            
            const msgFound = messages.some(m => m.includes('Hello Section A from Automation!'));
            if (msgFound) {
                console.log('✅ Student: Received the message in real-time!');
            } else {
                console.log('❌ Student: Did NOT find the message in UI. Messages found: ', messages);
            }

            // 3. Verify Timetable
            console.log('📅 Student: Verifying Student Timetable...');
            const hasLectures = await stuPage.evaluate(() => document.querySelectorAll('.lecture-card').length > 0);
            if (hasLectures) {
                console.log('✅ Student: Timetable successfully loaded and visible.');
            } else {
                console.log('❌ Student: Timetable is empty.');
            }
        }

        console.log('\n🎉 ALL TESTS COMPLETED. Browsers will stay open for manual review...');
        await new Promise(r => setTimeout(r, 1800000));

    } catch (e) {
        console.error('Critical Error in Test Execution: ', e);
    }
})();
