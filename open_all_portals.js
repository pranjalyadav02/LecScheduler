const puppeteer = require('puppeteer-core');

(async () => {
    console.log('🚀 Launching All Portals (Ultra-Stable v5)...');
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    async function launchPortal(name, url, role, user, pass) {
        console.log(`   - Launching ${name}...`);
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: edgePath,
            defaultViewport: null,
            args: ['--start-maximized', '--window-name=' + name]
        });
        const page = (await browser.pages())[0];
        try {
            await page.goto('http://localhost:8000/pages/login.html', { waitUntil: 'networkidle2' });
            await page.waitForSelector(`[data-role="${role}"]`);
            await page.click(`[data-role="${role}"]`);
            await new Promise(r => setTimeout(r, 2000));

            if (role === 'admin') {
                await page.type('#adminEmail', user);
                await page.type('#adminPassword', pass);
                await page.click('#adminForm button[type="submit"]');
            } else if (role === 'faculty') {
                await page.type('#facultyEmail', user);
                await page.type('#facultyPassword', pass);
                await page.click('#facultyForm button[type="submit"]');
            } else {
                await page.type('#enrollmentNo', user);
                await page.type('#studentPassword', pass);
                await page.click('#studentForm button[type="submit"]');
            }
            console.log(`✅ ${name} logged in!`);
        } catch (e) {
            console.log(`⚠️ ${name} auto-login error (you may need to click login manually): ${e.message}`);
        }
    }

    await launchPortal('Admin', 'http://localhost:8000/pages/admin.html', 'admin', 'admin@institution.edu', 'Admin@123456');
    await launchPortal('Faculty', 'http://localhost:8000/pages/faculty.html', 'faculty', 'dr_rajesh_verma@college.ac.in', 'Test@123478');
    await launchPortal('Student', 'http://localhost:8000/pages/student.html', 'student', 'MCA2026001', 'Default@1234');

    console.log('\n📌 All browsers are active. Keep this terminal open.');
    await new Promise(r => setTimeout(r, 1800000));
})();
