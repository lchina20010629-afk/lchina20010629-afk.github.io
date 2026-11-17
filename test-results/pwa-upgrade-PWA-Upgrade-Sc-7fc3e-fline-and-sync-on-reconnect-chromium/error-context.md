# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-upgrade.spec.ts >> PWA Upgrade Scenarios >> should mark offline and sync on reconnect
- Location: e2e/pwa-upgrade.spec.ts:126:3

# Error details

```
ReferenceError: require is not defined
```

# Test source

```ts
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
  47  |     const swContent = readFileSync(swPath, 'utf-8');
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
> 127 |     const { spawn } = require('child_process');
      |                       ^ ReferenceError: require is not defined
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
  148 |             isOffline: resp.headers.get('X-Offline-Response') === 'true'
  149 |           };
  150 |         } catch (err) {
  151 |           return { error: true };
  152 |         }
  153 |       });
  154 |       
  155 |       // Should get cached version with offline marker
  156 |       if (!offlineResponse.error) {
  157 |         expect(offlineResponse.isOffline).toBe(true);
  158 |       }
  159 |       
  160 |       // Go back online
  161 |       await context.setOffline(false);
  162 |       await page.waitForTimeout(500);
  163 |       
  164 |       // Should fetch fresh data
  165 |       const onlineResponse = await page.evaluate(async () => {
  166 |         const resp = await fetch('/data/manifest.json', { cache: 'no-store' });
  167 |         return {
  168 |           status: resp.status,
  169 |           isOffline: resp.headers.get('X-Offline-Response') === 'true'
  170 |         };
  171 |       });
  172 |       
  173 |       expect(onlineResponse.status).toBe(200);
  174 |       expect(onlineResponse.isOffline).not.toBe(true);
  175 |       
  176 |     } finally {
  177 |       await context.setOffline(false);
  178 |       server.kill();
  179 |     }
  180 |   });
  181 | 
  182 |   test('should not lose unsaved edits on SW update', async ({ page }) => {
  183 |     // Initialize vault and create a draft
  184 |     await page.goto('http://localhost:5173/#/settings');
  185 |     await page.waitForTimeout(500);
  186 |     
  187 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  188 |     await page.waitForTimeout(200);
  189 |     
  190 |     await page.locator('#password').fill(TEST_PASSWORD);
  191 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  192 |     await page.getByRole('button', { name: '确认初始化' }).click();
  193 |     
  194 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  195 |     
  196 |     // Go to diary create page
  197 |     await page.goto('http://localhost:5173/#/diary/create');
  198 |     await page.waitForTimeout(500);
  199 |     
  200 |     // Start typing (unsaved edits)
  201 |     await page.locator('#title').fill('测试未保存内容');
  202 |     await page.locator('#content').fill('这是一些未保存的内容，不应该在SW更新时丢失');
  203 |     
  204 |     // Simulate SW update becoming available
  205 |     // (In real scenario, new SW would be waiting)
  206 |     // Verify content still there
  207 |     await page.waitForTimeout(1000);
  208 |     
  209 |     const titleValue = await page.locator('#title').inputValue();
  210 |     const contentValue = await page.locator('#content').inputValue();
  211 |     
  212 |     expect(titleValue).toBe('测试未保存内容');
  213 |     expect(contentValue).toBe('这是一些未保存的内容，不应该在SW更新时丢失');
  214 |   });
  215 | 
  216 |   test('should coordinate upgrade across multiple windows', async ({ browser }) => {
  217 |     const context1 = await browser.newContext();
  218 |     const context2 = await browser.newContext();
  219 |     const page1 = await context1.newPage();
  220 |     const page2 = await context2.newPage();
  221 |     
  222 |     try {
  223 |       // Open same app in two windows
  224 |       await page1.goto('http://localhost:5173/#/');
  225 |       await page2.goto('http://localhost:5173/#/');
  226 |       
  227 |       await page1.waitForTimeout(1000);
```