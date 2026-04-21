const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 Launching Visible End-to-End Chat Test...');
    
    // Launch visible browser using user's Edge
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--window-size=900,800', '--window-position=0,0']
    });

    const browser2 = await puppeteer.launch({ 
        headless: false,
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--window-size=900,800', '--window-position=900,0']
    });
    
    // Create isolated contexts so sessions don't clash
    const facultyContext = await browser.createBrowserContext();
    const studentContext = await browser2.createBrowserContext();

    const facultyPage = await facultyContext.newPage();
    const studentPage = await studentContext.newPage();

    let success = false;

    try {
        console.log('1. Logging in as Teacher (Dr. Rajesh Verma)...');
        await facultyPage.goto('http://localhost:8000/pages/login.html');

        // Clear local storage to prevent auto-login
        await facultyPage.evaluate(() => localStorage.clear());
        await facultyPage.reload({ waitUntil: 'networkidle2' });

        await facultyPage.waitForSelector('[data-role="faculty"]');
        await facultyPage.click('[data-role="faculty"]');
        
        await facultyPage.waitForSelector('#facultyEmail', {visible: true});
        await new Promise(r => setTimeout(r, 500));
        await facultyPage.type('#facultyEmail', 'dr_rajesh_verma@college.ac.in', {delay: 50});
        await facultyPage.type('#facultyPassword', 'Test@123478', {delay: 50});
        
        await Promise.all([
            facultyPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
            facultyPage.click('#facultyForm button[type="submit"]')
        ]);
        
        await facultyPage.waitForSelector('.action-card', { timeout: 10000 });
        console.log('✅ Faculty logged in successfully.');

        console.log('2. Logging in as Student (Alice)...');
        await studentPage.goto('http://localhost:8000/pages/login.html');

        // Clear local storage for student page too
        await studentPage.evaluate(() => localStorage.clear());
        await studentPage.reload({ waitUntil: 'networkidle2' });

        await studentPage.waitForSelector('[data-role="student"]');
        await studentPage.click('[data-role="student"]');

        await studentPage.waitForSelector('#enrollmentNo', {visible: true});
        await new Promise(r => setTimeout(r, 500));
        await studentPage.type('#enrollmentNo', 'MCA2026001', {delay: 50});
        await studentPage.type('#studentPassword', 'Default@1234', {delay: 50});
        
        await Promise.all([
            studentPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
            studentPage.click('#studentForm button[type="submit"]')
        ]);
        
        await studentPage.waitForSelector('.chat-card', { timeout: 10000 });
        console.log('✅ Student logged in successfully.');

        console.log('3. Student navigating to Group Chat...');
        await studentPage.evaluate(() => {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(t => { if(t.textContent.includes('Chat')) t.click(); });
        });
        await studentPage.waitForSelector('#chatMessages', { visible: true });
        await new Promise(r => setTimeout(r, 1000)); // wait for dom to settle

        console.log('4. Faculty configuring chat room...');
        await facultyPage.select('#chatSemSelect', 'mca_semester_ii');
        await facultyPage.select('#chatSecSelect', 'A');
        await facultyPage.evaluate(() => { if (typeof switchChat === 'function') switchChat(); });
        await new Promise(r => setTimeout(r, 1000)); // allow chat to init

        const testMessage = `Hello Alice! This is an automated real-time test [${new Date().toLocaleTimeString()}]`;
        console.log(`5. Faculty sending message: "${testMessage}"`);
        
        await facultyPage.type('#chatInput', testMessage, {delay: 50});
        await facultyPage.click('.chat-input-form .send-btn');
        
        console.log('6. Waiting for student portal to receive the message in real-time...');
        
        await studentPage.waitForFunction(
            (msgText) => {
                const texts = document.querySelectorAll('.msg-text');
                for (let t of texts) if (t.textContent.includes(msgText)) return true;
                return false;
            },
            { timeout: 10000 },
            testMessage
        );
        
        console.log('✅ FEATURE VERIFIED: The message appeared in the student\'s chat window in real-time!');
        success = true;

        console.log('Leaving windows open for 15s to allow manual verification before auto-closing...');
        await new Promise(r => setTimeout(r, 15000));

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        await browser.close();
        await browser2.close();
        if(!success) process.exit(1);
    }
})();
