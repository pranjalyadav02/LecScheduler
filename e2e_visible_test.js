const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 Launching Visible End-to-End Chat Test...');
    
    // Launch visible browser using user's Edge
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--window-size=800,800', '--window-position=0,0']
    });

    // Launch a second independent browser instance for the student
    const browser2 = await puppeteer.launch({ 
        headless: false,
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--window-size=800,800', '--window-position=800,0', '--incognito']
    });
    
    const facultyPage = (await browser.pages())[0] || await browser.newPage();
    const studentPage = (await browser2.pages())[0] || await browser2.newPage();

    let success = false;

    try {
        console.log('1. Logging in as Teacher (Dr. Rajesh Verma)...');
        await facultyPage.goto('http://localhost:8000/pages/login.html');
        // Let the user see the page before acting
        await new Promise(r => setTimeout(r, 1000));
        
        await facultyPage.click('[data-role="faculty"]');
        await new Promise(r => setTimeout(r, 500));
        await facultyPage.type('#facultyEmail', 'dr_rajesh_verma@college.ac.in', {delay: 50});
        await facultyPage.type('#facultyPassword', 'Test@123478', {delay: 50});
        
        await Promise.all([
            facultyPage.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
            facultyPage.click('#facultyForm button[type="submit"]')
        ]);
        
        await facultyPage.waitForSelector('.action-card', { timeout: 10000 });
        console.log('✅ Faculty logged in successfully.');

        console.log('2. Logging in as Student (Alice)...');
        await studentPage.goto('http://localhost:8000/pages/login.html');
        await new Promise(r => setTimeout(r, 1000));

        // Click student role just in case
        await studentPage.click('[data-role="student"]');
        await new Promise(r => setTimeout(r, 500));

        await studentPage.type('#enrollmentNo', 'MCA2026001', {delay: 50});
        await studentPage.type('#studentPassword', 'Default@1234', {delay: 50});
        
        await Promise.all([
            studentPage.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
            studentPage.click('#studentForm button[type="submit"]')
        ]);
        
        await studentPage.waitForSelector('.chat-card', { timeout: 10000 });
        console.log('✅ Student logged in successfully.');

        // Student open chat tab
        console.log('3. Student navigating to Group Chat...');
        await studentPage.evaluate(() => {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(t => { if(t.textContent.includes('Chat')) t.click(); });
        });
        await studentPage.waitForSelector('#chatMessages', { visible: true });

        // Ensure Faculty selects Semester II and Section A
        await new Promise(r => setTimeout(r, 1000));
        await facultyPage.select('#chatSemSelect', 'mca_semester_ii');
        await facultyPage.select('#chatSecSelect', 'A');
        await new Promise(r => setTimeout(r, 1000));

        const testMessage = `Hello Alice! This is an automated real-time test [${new Date().toLocaleTimeString()}]`;
        console.log(`4. Faculty sending message: "${testMessage}"`);
        
        await facultyPage.type('#chatInput', testMessage, {delay: 100});
        await facultyPage.click('.chat-input-form .send-btn');
        
        console.log('5. Waiting for student portal to receive the message in real-time...');
        
        // Wait maximum 5 seconds for message to appear via Firebase snapshot
        await studentPage.waitForFunction(
            (msgText) => {
                const texts = document.querySelectorAll('.msg-text');
                for (let t of texts) if (t.textContent.includes(msgText)) return true;
                return false;
            },
            { timeout: 5000 },
            testMessage
        );
        
        console.log('✅ FEATURE VERIFIED: The message appeared in the student\'s chat window in real-time!');
        success = true;

        // Leave windows open for user to interact for 30 seconds, then clean up
        console.log('Leaving windows open for 30s to allow manual verification...');
        await new Promise(r => setTimeout(r, 30000));

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        await browser.close();
        await browser2.close();
        if(!success) process.exit(1);
    }
})();
