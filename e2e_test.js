const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 Starting Real-Time End-to-End Chat Test...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const browser = await puppeteer.launch({ 
        headless: 'new',
        executablePath: chromePath
    });
    
    // Create two separate browser contexts (completely isolated sessions)
    const facultyContext = await browser.createBrowserContext();
    const studentContext = await browser.createBrowserContext();

    const facultyPage = await facultyContext.newPage();
    const studentPage = await studentContext.newPage();

    let success = false;

    try {
        console.log('1. Logging in as Teacher (Dr. Rajesh Verma)...');
        await facultyPage.goto('http://localhost:8000/pages/login.html');
        await new Promise(r => setTimeout(r, 2000));
        await facultyPage.waitForSelector('[data-role="faculty"]');
        await facultyPage.click('[data-role="faculty"]');
        await new Promise(r => setTimeout(r, 500));
        await facultyPage.type('#facultyEmail', 'dr_rajesh_verma@college.ac.in');
        await facultyPage.type('#facultyPassword', 'Test@123478');
        await facultyPage.click('#facultyForm button[type="submit"]');
        
        await facultyPage.waitForSelector('.faculty-header', { timeout: 15000 });
        console.log('✅ Faculty logged in successfully.');

        console.log('2. Logging in as Student (Alice)...');
        await studentPage.goto('http://localhost:8000/pages/login.html');
        await new Promise(r => setTimeout(r, 2000));
        await studentPage.waitForSelector('#enrollmentNo');
        await studentPage.type('#enrollmentNo', 'MCA2026001');
        await studentPage.type('#studentPassword', 'Default@1234');
        await studentPage.click('#studentForm button[type="submit"]');
        
        await studentPage.waitForSelector('.student-header', { timeout: 15000 });
        console.log('✅ Student logged in successfully.');

        // Student open chat tab
        console.log('3. Student navigating to Group Chat...');
        await studentPage.evaluate(() => {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(t => { if(t.textContent.includes('Chat')) t.click(); });
        });
        await studentPage.waitForSelector('#chatMessages', { visible: true });

        const initialCount = await studentPage.$$eval('#chatMessages .message', msgs => msgs.length);
        console.log(`- Student currently sees ${initialCount} messages.`);

        // Faculty open chat
        console.log('4. Faculty navigating to Group Chat...');
        await facultyPage.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('.primary-btn')).find(b => b.innerText.includes('Enter Group Chat'));
            if(btn) btn.click();
        });
        await facultyPage.waitForSelector('#chatSemSelect', { visible: true });
        await facultyPage.select('#chatSemSelect', 'mca_semester_ii');
        await new Promise(r => setTimeout(r, 2000));

        const testMessage = `Real-time test ! [${Date.now()}]`;
        console.log(`5. Faculty sending message: "${testMessage}"`);
        
        await facultyPage.type('#chatInput', testMessage);
        await facultyPage.click('.chat-input-form .send-btn');
        
        console.log('6. Waiting for student portal to receive the message in real-time...');
        
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

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        await browser.close();
        if(!success) process.exit(1);
    }
})();
