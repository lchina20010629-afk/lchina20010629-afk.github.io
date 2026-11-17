# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-upgrade.spec.ts >> PWA Upgrade Scenarios >> should detect service worker update
- Location: e2e/pwa-upgrade.spec.ts:63:3

# Error details

```
ReferenceError: require is not defined
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import { execSync } from 'child_process';
  3   | import { mkdirSync, writeFileSync, rmSync } from 'fs';
  4   | import { join } from 'path';
  5   | 
  6   | const TEST_PASSWORD = 'TestPass123!';
  7   | 
  8   | /**
  9   |  * PWA Upgrade Tests
  10  |  * Tests real production build A→B upgrade scenarios:
  11  |  * - Service worker shell switching
  12  |  * - Manifest same-date content updates
  13  |  * - Image cache invalidation
  14  |  * - Offline marking and reconnect sync
  15  |  * - Unsaved edits not lost on reload
  16  |  * - Multiple window upgrade coordination
  17  |  */
  18  | 
  19  | test.describe('PWA Upgrade Scenarios', () => {
  20  |   let buildADir: string;
  21  |   let buildBDir: string;
  22  | 
  23  |   test.beforeAll(() => {
  24  |     // Create two production builds to simulate upgrade
  25  |     console.log('\n🔨 Building version A and B for upgrade testing...\n');
  26  |     
  27  |     buildADir = '/tmp/pwa-test-build-a';
  28  |     buildBDir = '/tmp/pwa-test-build-b';
  29  |     
  30  |     // Clean old builds
  31  |     [buildADir, buildBDir].forEach(dir => {
  32  |       try { rmSync(dir, { recursive: true, force: true }); } catch {}
  33  |       mkdirSync(dir, { recursive: true });
  34  |     });
  35  |     
  36  |     // Build version A
  37  |     console.log('Building version A...');
  38  |     execSync('npm run build', { 
  39  |       cwd: '/agent/repos/lchina20010629-afk.github.io',
  40  |       stdio: 'pipe'
  41  |     });
  42  |     execSync(`cp -r /agent/repos/lchina20010629-afk.github.io/dist/* ${buildADir}/`, { stdio: 'pipe' });
  43  |     
  44  |     // Modify service worker version for build B
  45  |     console.log('Building version B (modified SW)...');
  46  |     const swPath = '/agent/repos/lchina20010629-afk.github.io/public/sw.js';
> 47  |     const swContent = require('fs').readFileSync(swPath, 'utf-8');
      |                       ^ ReferenceError: require is not defined
  48  |     const swModified = swContent.replace("const CACHE_VERSION = 'v1'", "const CACHE_VERSION = 'v2'");
  49  |     writeFileSync(swPath, swModified, 'utf-8');
  50  |     
  51  |     execSync('npm run build', { 
  52  |       cwd: '/agent/repos/lchina20010629-afk.github.io',
  53  |       stdio: 'pipe'
  54  |     });
  55  |     execSync(`cp -r /agent/repos/lchina20010629-afk.github.io/dist/* ${buildBDir}/`, { stdio: 'pipe' });
  56  |     
  57  |     // Restore original SW
  58  |     writeFileSync(swPath, swContent, 'utf-8');
  59  |     
  60  |     console.log('✅ Builds A and B created\n');
  61  |   });
  62  | 
  63  |   test('should detect service worker update', async ({ page }) => {
  64  |     // Start static server for build A
  65  |     const { spawn } = require('child_process');
  66  |     const server = spawn('npx', ['http-server', buildADir, '-p', '8177', '--silent'], {
  67  |       stdio: 'pipe'
  68  |     });
  69  |     
  70  |     await new Promise(resolve => setTimeout(resolve, 2000));
  71  |     
  72  |     try {
  73  |       await page.goto('http://localhost:8177/#/');
  74  |       await page.waitForTimeout(2000);
  75  |       
  76  |       // Wait for SW registration
  77  |       const swRegistered = await page.evaluate(() => {
  78  |         return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
  79  |       });
  80  |       
  81  |       expect(swRegistered).toBe(true);
  82  |       
  83  |       // Check cache version A
  84  |       const cacheNameA = await page.evaluate(async () => {
  85  |         const caches = await window.caches.keys();
  86  |         return caches.find(c => c.includes('shell'));
  87  |       });
  88  |       
  89  |       expect(cacheNameA).toContain('v1');
  90  |       
  91  |     } finally {
  92  |       server.kill();
  93  |     }
  94  |   });
  95  | 
  96  |   test('should handle manifest content updates with same date', async ({ page }) => {
  97  |     const { spawn } = require('child_process');
  98  |     const server = spawn('npx', ['http-server', buildADir, '-p', '8178', '--silent'], {
  99  |       stdio: 'pipe'
  100 |     });
  101 |     
  102 |     await new Promise(resolve => setTimeout(resolve, 2000));
  103 |     
  104 |     try {
  105 |       await page.goto('http://localhost:8178/#/');
  106 |       await page.waitForTimeout(1000);
  107 |       
  108 |       // Check manifest loads fresh (network-first)
  109 |       const manifestResponse = await page.evaluate(async () => {
  110 |         const resp = await fetch('/data/manifest.json', { cache: 'no-store' });
  111 |         return {
  112 |           status: resp.status,
  113 |           cached: resp.headers.get('X-Offline-Response') === 'true'
  114 |         };
  115 |       });
  116 |       
  117 |       expect(manifestResponse.status).toBe(200);
  118 |       // Should NOT be from offline cache (network-first strategy)
  119 |       expect(manifestResponse.cached).not.toBe(true);
  120 |       
  121 |     } finally {
  122 |       server.kill();
  123 |     }
  124 |   });
  125 | 
  126 |   test('should mark offline and sync on reconnect', async ({ page, context }) => {
  127 |     const { spawn } = require('child_process');
  128 |     const server = spawn('npx', ['http-server', buildADir, '-p', '8179', '--silent'], {
  129 |       stdio: 'pipe'
  130 |     });
  131 |     
  132 |     await new Promise(resolve => setTimeout(resolve, 2000));
  133 |     
  134 |     try {
  135 |       await page.goto('http://localhost:8179/#/');
  136 |       await page.waitForTimeout(1000);
  137 |       
  138 |       // Go offline
  139 |       await context.setOffline(true);
  140 |       await page.waitForTimeout(500);
  141 |       
  142 |       // Try to fetch manifest
  143 |       const offlineResponse = await page.evaluate(async () => {
  144 |         try {
  145 |           const resp = await fetch('/data/manifest.json');
  146 |           return {
  147 |             status: resp.status,
```