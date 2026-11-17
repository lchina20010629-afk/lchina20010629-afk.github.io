#!/usr/bin/env node

/**
 * Switchable HTTP server for PWA A→B upgrade testing
 * Serves static files from a configurable root directory
 * Can switch root directory at runtime via control endpoint
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.enc': 'application/octet-stream',
};

class SwitchableServer {
  constructor(port = 5555) {
    this.port = port;
    this.rootDir = null;
    this.server = null;
  }

  setRoot(dir) {
    this.rootDir = dir;
    console.log(`[Server] Root directory set to: ${dir}`);
  }

  async handleRequest(req, res) {
    // Control endpoint to switch root directory
    if (req.url === '/__control/switch' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { root } = JSON.parse(body);
          this.setRoot(root);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, root: this.rootDir }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // Health check endpoint
    if (req.url === '/__control/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ healthy: true, root: this.rootDir }));
      return;
    }

    if (!this.rootDir) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server root directory not set');
      return;
    }

    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query string
    const queryIndex = filePath.indexOf('?');
    if (queryIndex !== -1) {
      filePath = filePath.substring(0, queryIndex);
    }

    // Remove hash
    const hashIndex = filePath.indexOf('#');
    if (hashIndex !== -1) {
      filePath = filePath.substring(0, hashIndex);
    }

    const fullPath = join(this.rootDir, filePath);

    try {
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        const indexPath = join(fullPath, 'index.html');
        try {
          const content = await readFile(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
        return;
      }

      const content = await readFile(fullPath);
      const ext = extname(fullPath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache' // Force revalidation
      });
      res.end(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    }
  }

  start() {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, () => {
        console.log(`[Server] Listening on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log(`[Server] Stopped`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// CLI mode
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = parseInt(process.argv[2]) || 5555;
  const initialRoot = process.argv[3];
  
  const server = new SwitchableServer(port);
  if (initialRoot) {
    server.setRoot(initialRoot);
  }
  
  server.start().then(() => {
    console.log(`[Server] Ready. Use POST to http://localhost:${port}/__control/switch to change root`);
  });

  process.on('SIGINT', async () => {
    console.log('\n[Server] Shutting down...');
    await server.stop();
    process.exit(0);
  });
}

export default SwitchableServer;
