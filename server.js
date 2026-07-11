const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Proxy Torrentio requests to bypass CORS
    if (req.url.startsWith('/api/search/')) {
        const imdbId = req.url.split('/api/search/')[1];
        if (!imdbId) {
            res.writeHead(400);
            res.end('Missing IMDb ID');
            return;
        }

        const torrentioUrl = `https://torrentio.strem.fun/stream/movie/${imdbId}`;
        
        https.get(torrentioUrl, (proxyRes) => {
            // Forward headers and status
            const headers = { ...proxyRes.headers };
            // Ensure we set our own CORS header and remove conflicting ones if present
            headers['access-control-allow-origin'] = '*';
            
            res.writeHead(proxyRes.statusCode, headers);
            proxyRes.pipe(res);
        }).on('error', (e) => {
            console.error(`Proxy error for ${imdbId}:`, e);
            res.writeHead(500);
            res.end('Proxy error');
        });
        return;
    }

    // Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(` Search Engine Server is running!          `);
    console.log(` Please open: http://localhost:${PORT}/    `);
    console.log(`===========================================`);
});
