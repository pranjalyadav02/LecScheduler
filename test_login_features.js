#!/usr/bin/env node

/**
 * TEST LOGIN FEATURES
 * Tests all login functionality by accessing the application
 */

const http = require('http');
const { exec } = require('child_process');

function testFeature(featureName, url, credentials) {
    return new Promise((resolve) => {
        console.log(`\n🧪 Testing ${featureName}...`);
        console.log(`📍 URL: ${url}`);
        console.log(`🔑 Credentials: ${credentials}`);
        
        // Open the URL in browser
        exec(`start ${url}`, (error) => {
            if (error) {
                console.log(`❌ Failed to open ${featureName}: ${error.message}`);
            } else {
                console.log(`✅ ${featureName} opened successfully`);
                console.log(`💡 Please login manually with the provided credentials`);
            }
            resolve();
        });
    });
}

async function runAllTests() {
    console.log('🚀 Starting Lecture Scheduler Feature Tests');
    console.log('===========================================');

    // Test Student Login
    await testFeature(
        'Student Portal',
        'http://localhost:5000/pages/login.html',
        'Enrollment: MCA2026001, Password: Default@1234'
    );

    // Wait for user to test
    await new Promise(resolve => {
        console.log('\n⏳ Press Enter to continue to Faculty test...');
        process.stdin.once('data', resolve);
    });

    // Test Faculty Login
    await testFeature(
        'Faculty Portal',
        'http://localhost:5000/pages/login.html',
        'Email: dr_rajesh_verma@college.ac.in, Password: Test@123478'
    );

    // Wait for user to test
    await new Promise(resolve => {
        console.log('\n⏳ Press Enter to continue to Admin test...');
        process.stdin.once('data', resolve);
    });

    // Test Admin Login
    await testFeature(
        'Admin Portal',
        'http://localhost:5000/pages/login.html',
        'Email: admin@institution.edu, Password: Admin@123456'
    );

    console.log('\n🎉 All login features tested!');
    console.log('\n📋 Features to verify:');
    console.log('✅ Student: View timetable, chat, notifications');
    console.log('✅ Faculty: View lectures, cancel/reschedule, announcements');
    console.log('✅ Admin: Upload PDF, manage users, view all data');
    console.log('✅ Navigation: Proper redirects between portals');
    console.log('✅ Logout: Returns to login page');
}

// Enable stdin input
process.stdin.resume();

runAllTests().then(() => {
    process.exit(0);
});
