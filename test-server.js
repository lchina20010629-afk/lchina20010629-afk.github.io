#!/usr/bin/env node
/**
 * Simple static server with SPA fallback for testing
 * Serves dist/ folder with proper routing for GitHub Pages
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8174;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  
  // Remove leading slash for proper path resolution
  if (req.url !== '/') {
    filePath = path.join(DIST_DIR, req.url.split('?')[0].slice(1));
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA fallback - serve index.html for all non-file routes
      if (path.extname(filePath) === '') {
        filePath = path.join(DIST_DIR, 'index.html');
      } else {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
    }

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Static server running on http://localhost:${PORT}`);
  console.log(`Serving: ${DIST_DIR}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
