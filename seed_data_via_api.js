#!/usr/bin/env node

/**
 * TIMETABLE SEEDING SERVER
 * Serves the seeding page that creates test data
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8001;

const server = http.createServer((req, res) => {
    // Serve the seed.html file
    const seedPath = path.join(__dirname, 'frontend', 'seed.html');
    
    fs.readFile(seedPath, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error: seed.html not found. Make sure it exists in frontend/ directory.');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log('\n🚀 Timetable Seeding Server Started!\n');
    console.log('📍 Open in browser: http://localhost:' + PORT + '\n');
    console.log('Then click the button to seed the timetable data.\n');
    console.log('Press Ctrl+C to stop the server.\n');
});
