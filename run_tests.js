const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 Running Final Automated Test...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function login(role, user, pass, pos) {
        const browser = await puppeteer.launch({ headless: false, executablePath: chromePath, args: [`--window-size=600,700`, `--window-position=${pos}`] });
        const page = await browser.newPage();
        
        await page.goto('http://localhost:8000/pages/login.html');
        await new Promise(r => setTimeout(r, 2000));
        
        // Force the form to show using JS
        await page.evaluate((r) => {
            document.querySelectorAll('.role-form').forEach(f => f.classList.remove('active'));
            document.getElementById(r + 'Form').classList.add('active');
        }, role);

        // Fill credentials
        await page.evaluate((r, u, p) => {
            if (r === 'admin') { document.getElementById('adminEmail').value = u; document.getElementById('adminPassword').value = p; }
            if (r === 'faculty') { document.getElementById('facultyEmail').value = u; document.getElementById('facultyPassword').value = p; }
            if (r === 'student') { document.getElementById('enrollmentNo').value = u; document.getElementById('studentPassword').value = p; }
        }, role, user, pass);

        // Submit form
        await page.evaluate((r) => {
            const form = document.getElementById(r + 'Form');
            form.querySelector('button[type="submit"]').click();
        }, role);

        await new Promise(r => setTimeout(r, 10000)); // wait 10 full seconds for firebase auth & data
        return { browser, page };
    }

    try {
        const { page: facPage } = await login('faculty', 'dr_rajesh_verma@college.ac.in', 'Test@123478', '0,0');
        const { page: stuPage } = await login('student', 'MCA2026001', 'Default@1234', '600,0');

        console.log('💬 Testing chat from Faculty to Student...');
        
        await facPage.evaluate(() => {
            document.getElementById('chatSemSelect').value = 'mca_semester_ii';
            document.getElementById('chatSecSelect').value = 'A';
            if(window.switchChat) window.switchChat(); // Force chat load
        });
        
        await new Promise(r => setTimeout(r, 4000));

        await facPage.evaluate(() => {
            document.getElementById('chatInput').value = 'SYSTEM TEST MESSAGE 101';
            document.querySelector('.chat-input-form button').click();
        });

        console.log('👀 Checking student receipt...');
        // Student might need to click the Chat tab. The UI has tab navigation!
        await stuPage.evaluate(() => {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(t => { if(t.innerText.includes('Chat')) t.click(); });
        });

        await new Promise(r => setTimeout(r, 5000));

        const received = await stuPage.evaluate(() => {
            return document.body.innerHTML.includes('SYSTEM TEST MESSAGE 101');
        });

        if (received) {
            console.log('✅✅✅ CHAT VERIFIED! Student received the message successfully.');
        } else {
            console.log('❌ Failed to verify chat message.');
        }
        
    } catch(e) {
        console.error(e.message);
    }
    
    console.log('Leave open for 3 minutes...');
    await new Promise(r => setTimeout(r, 180000));
})();
