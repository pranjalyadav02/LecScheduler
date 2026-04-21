#!/usr/bin/env node

/**
 * DEVELOPMENT SERVER
 * Serves the LecScheduler application frontend on localhost:5000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Handle root requests
    if (pathname === '/' || pathname === '') {
        pathname = '/pages/login.html';
    }

    // Prevent directory traversal
    if (pathname.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    // Remove /frontend prefix if present
    if (pathname.startsWith('/frontend/')) {
        pathname = pathname.substring(9);
    }

    // Construct full file path
    let filePath = path.join(FRONTEND_DIR, pathname);

    // Check if it's a directory and try index.html
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                // 404 Not Found
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 Not Found</title>
                        <style>
                            body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
                            h1 { color: #d32f2f; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file could not be found: ${pathname}</p>
                        <p><a href="/">Return to Login</a></p>
                    </body>
                    </html>
                `);
                return;
            }

            // Get file extension
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            // Set response headers with CORS
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });

            res.end(data);
        });
    });
});

server.listen(PORT, 'localhost', () => {
    console.log('\n🎓 LecScheduler Development Server Started!');
    console.log(`\n📍 Access the application at: http://localhost:${PORT}`);
    console.log(`\n✨ Portal URLs:`);
    console.log(`   • Login: http://localhost:${PORT}/pages/login.html`);
    console.log(`\n💡 Press Ctrl+C to stop the server\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down the development server...');
    process.exit(0);
});
