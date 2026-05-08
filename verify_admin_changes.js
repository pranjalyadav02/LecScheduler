const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 VERIFYING ADMIN CHANGES...');
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    const browser = await puppeteer.launch({ 
        headless: true, 
        executablePath: chromePath 
    });
    const page = await browser.newPage();
    
    try {
        console.log('1. Logging in as Admin...');
        await page.goto('http://localhost:8000/pages/login.html');
        await new Promise(r => setTimeout(r, 4000));
        
        await page.click('[data-role="admin"]');
        await new Promise(r => setTimeout(r, 2000));
        
        await page.type('#adminEmail', 'admin@institution.edu');
        await page.type('#adminPassword', 'Admin@123456');
        await page.click('#adminForm button[type="submit"]');
        
        await new Promise(r => setTimeout(r, 10000));
        console.log(`   - Current URL: ${await page.url()}`);

        console.log('2. Selecting Semester...');
        await page.select('#semesterSelect', 'mca_semester_ii');
        await new Promise(r => setTimeout(r, 5000));

        console.log('3. Checking Dashboard Summary...');
        const summaryText = await page.evaluate(() => document.getElementById('lectureStatus').innerText);
        console.log(`   - Summary Text: "${summaryText}"`);
        const hasSectionCounts = summaryText.includes('Section-wise') || summaryText.includes('Sec A:');
        console.log(`   - Has Section Counts: ${hasSectionCounts}`);

        console.log('4. Opening Timetable Modal...');
        await page.click('button[onclick="showTimetableModal()"]');
        await new Promise(r => setTimeout(r, 5000));

        console.log('5. Verifying Modal Features...');
        const modalFeatures = await page.evaluate(() => {
            const modal = document.getElementById('timetableModal');
            const content = modal.querySelector('.modal-content');
            const hasWideClass = content.classList.contains('wide-modal');
            
            const title = modal.querySelector('h2').innerText;
            const hasSemesterInTitle = title.includes('MCA Semester II');
            
            const filter = document.getElementById('modalSecFilter');
            const hasFilter = !!filter;
            const filterOptions = filter ? Array.from(filter.options).map(o => o.text) : [];
            
            const table = modal.querySelector('.data-table');
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText);
            const hasCodeAndSection = headers.includes('Code') && headers.includes('Section');
            
            const rows = table.querySelectorAll('tbody tr').length;
            
            return { hasWideClass, title, hasSemesterInTitle, hasFilter, filterOptions, headers, hasCodeAndSection, rows };
        });

        console.log('   - Result:', JSON.stringify(modalFeatures, null, 2));

        if (modalFeatures.hasWideClass && modalFeatures.hasFilter && modalFeatures.hasCodeAndSection) {
            console.log('\n✅ ALL CHANGES VERIFIED SUCCESSFULLY!');
        } else {
            console.log('\n⚠️ SOME CHANGES MIGHT BE MISSING. CHECK LOGS.');
        }

    } catch (e) {
        console.error(`   ❌ Verification Error: ${e.message}`);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
