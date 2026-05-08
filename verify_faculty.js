const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 SYSTEM AUDIT: Checking Faculty Lectures List...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    async function checkFaculty() {
        const browser = await puppeteer.launch({ headless: true, executablePath: chromePath });
        const page = await browser.newPage();
        
        try {
            await page.goto('http://localhost:8000/pages/login.html');
            await new Promise(r => setTimeout(r, 4000));
            
            // Select faculty
            await page.evaluate(() => {
                const btn = document.querySelector('[data-role="faculty"]');
                if(btn) btn.click();
            });
            await new Promise(r => setTimeout(r, 2000));
            
            // Fill credentials
            await page.evaluate(() => {
                document.getElementById('facultyEmail').value = 'dr_rajesh_verma@college.ac.in';
                document.getElementById('facultyPassword').value = 'Test@123478';
                document.getElementById('facultyForm').querySelector('button[type="submit"]').click();
            });
            
            await new Promise(r => setTimeout(r, 15000));
            
            // Click "View Lectures"
            await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                const viewBtn = Array.from(btns).find(b => b.innerText.includes('View Lectures'));
                if(viewBtn) viewBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 5000));
            
            // Check list
            const listInfo = await page.evaluate(() => {
                const list = document.getElementById('lecturesList');
                return {
                    html: list ? list.innerHTML : 'NULL',
                    count: list ? list.querySelectorAll('tr').length - 1 : 0 // -1 for header
                };
            });
            
            console.log(`   - Faculty Lectures Count: ${listInfo.count}`);
            if (listInfo.count > 0) {
                console.log('✅ Faculty lectures are visible.');
            } else {
                console.log('❌ No faculty lectures found in the list.');
                console.log(`   - List HTML: ${listInfo.html}`);
            }
            
            await browser.close();
        } catch (e) {
            console.error(`   ❌ Failed: ${e.message}`);
            if (browser) await browser.close();
        }
    }

    await checkFaculty();
})();
