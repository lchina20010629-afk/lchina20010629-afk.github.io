# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa-upgrade.spec.ts >> PWA Upgrade Scenarios >> should mark offline and sync on reconnect
- Location: e2e/pwa-upgrade.spec.ts:145:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - heading "个人成长" [level=1] [ref=e6]
        - paragraph [ref=e7]: 生活 • 学习 • 成长
      - navigation [ref=e8]:
        - link "今日总览" [ref=e9] [cursor=pointer]:
          - /url: "#/"
        - link "生活日记" [ref=e14] [cursor=pointer]:
          - /url: "#/diary"
        - link "成长学习" [ref=e18] [cursor=pointer]:
          - /url: "#/learning"
        - link "总结回顾" [ref=e22] [cursor=pointer]:
          - /url: "#/reviews"
        - link "设置" [ref=e27] [cursor=pointer]:
          - /url: "#/settings"
      - 'button "当前主题: 跟随系统" [ref=e33] [cursor=pointer]'
    - main [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e39]:
          - heading "今日总览" [level=1] [ref=e40]
          - paragraph [ref=e41]: 2026-11-17 • 今天
        - generic [ref=e42]:
          - generic [ref=e43]:
            - heading "生活日记" [level=3] [ref=e47]
            - paragraph [ref=e48]: 记录今天的点滴
            - link "查看日记" [ref=e49] [cursor=pointer]:
              - /url: "#/diary"
          - generic [ref=e50]:
            - heading "成长学习" [level=3] [ref=e54]
            - paragraph [ref=e55]: 今日学习进度
            - link "查看学习" [ref=e56] [cursor=pointer]:
              - /url: "#/learning"
          - generic [ref=e57]:
            - heading "总结回顾" [level=3] [ref=e62]
            - paragraph [ref=e63]: 周/月/年度回顾
            - link "查看总结" [ref=e64] [cursor=pointer]:
              - /url: "#/reviews"
        - generic [ref=e66]:
          - heading "暂无数据" [level=3] [ref=e71]
          - paragraph [ref=e72]: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
          - button "前往设置" [ref=e73] [cursor=pointer]
        - generic [ref=e74]:
          - heading "📅 外部自动化流程说明" [level=4] [ref=e75]
          - paragraph [ref=e76]: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
          - list [ref=e77]:
            - listitem [ref=e78]: 每天 10:30 - 课程准备
            - listitem [ref=e79]: 每天 23:30 - 日记整理润色
            - listitem [ref=e80]: 每周日 - 周总结
            - listitem [ref=e81]: 每月最后一天 - 月总结
            - listitem [ref=e82]: 12月31日 - 年终总结
          - paragraph [ref=e83]: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
  - button "检查更新" [ref=e84] [cursor=pointer]
```

# Test source

```ts
  76  |       // Check SW registration status
  77  |       const swStatus = await page.evaluate(async () => {
  78  |         if (!('serviceWorker' in navigator)) {
  79  |           return { error: 'ServiceWorker not supported' };
  80  |         }
  81  |         
  82  |         const reg = await navigator.serviceWorker.ready;
  83  |         return {
  84  |           controller: navigator.serviceWorker.controller !== null,
  85  |           state: reg.active?.state,
  86  |           scriptURL: reg.active?.scriptURL
  87  |         };
  88  |       });
  89  |       
  90  |       console.log('SW Status:', swStatus);
  91  |       expect(swStatus.controller).toBe(true);
  92  |       
  93  |       // Test actual functionality instead of checking cache internals
  94  |       // Try to load a resource that should be cached
  95  |       await page.waitForTimeout(2000);
  96  |       
  97  |       const canLoadOffline = await page.evaluate(async () => {
  98  |         try {
  99  |           // Try to fetch index.html which should be cached
  100 |           const response = await fetch('/index.html', { cache: 'force-cache' });
  101 |           return response.ok;
  102 |         } catch {
  103 |           return false;
  104 |         }
  105 |       });
  106 |       
  107 |       console.log('Can load resources (SW functional):', canLoadOffline);
  108 |       expect(canLoadOffline).toBe(true);
  109 |       
  110 |     } finally {
  111 |       server.kill();
  112 |     }
  113 |   });
  114 | 
  115 |   test('should handle manifest content updates with same date', async ({ page }) => {
  116 |     const server: ChildProcess = spawn('npx', ['http-server', buildADir, '-p', '8178', '--silent'], {
  117 |       stdio: 'pipe',
  118 |       shell: true
  119 |     });
  120 |     
  121 |     await new Promise(resolve => setTimeout(resolve, 2000));
  122 |     
  123 |     try {
  124 |       await page.goto('http://localhost:8178/#/');
  125 |       await page.waitForTimeout(1000);
  126 |       
  127 |       // Check manifest loads fresh (network-first)
  128 |       const manifestResponse = await page.evaluate(async () => {
  129 |         const resp = await fetch('/data/manifest.json', { cache: 'no-store' });
  130 |         return {
  131 |           status: resp.status,
  132 |           cached: resp.headers.get('X-Offline-Response') === 'true'
  133 |         };
  134 |       });
  135 |       
  136 |       expect(manifestResponse.status).toBe(200);
  137 |       // Should NOT be from offline cache (network-first strategy)
  138 |       expect(manifestResponse.cached).not.toBe(true);
  139 |       
  140 |     } finally {
  141 |       server.kill();
  142 |     }
  143 |   });
  144 | 
  145 |   test('should mark offline and sync on reconnect', async ({ page, context }) => {
  146 |     const server: ChildProcess = spawn('npx', ['http-server', buildADir, '-p', '8179', '--silent'], {
  147 |       stdio: 'pipe',
  148 |       shell: true
  149 |     });
  150 |     
  151 |     await new Promise(resolve => setTimeout(resolve, 2000));
  152 |     
  153 |     try {
  154 |       await page.goto('http://localhost:8179/#/');
  155 |       await page.waitForTimeout(1000);
  156 |       
  157 |       // Go offline
  158 |       await context.setOffline(true);
  159 |       await page.waitForTimeout(500);
  160 |       
  161 |       // Try to fetch manifest
  162 |       const offlineResponse = await page.evaluate(async () => {
  163 |         try {
  164 |           const resp = await fetch('/data/manifest.json');
  165 |           return {
  166 |             status: resp.status,
  167 |             isOffline: resp.headers.get('X-Offline-Response') === 'true'
  168 |           };
  169 |         } catch (err) {
  170 |           return { error: true };
  171 |         }
  172 |       });
  173 |       
  174 |       // Should get cached version with offline marker
  175 |       if (!offlineResponse.error) {
> 176 |         expect(offlineResponse.isOffline).toBe(true);
      |                                           ^ Error: expect(received).toBe(expected) // Object.is equality
  177 |       }
  178 |       
  179 |       // Go back online
  180 |       await context.setOffline(false);
  181 |       await page.waitForTimeout(500);
  182 |       
  183 |       // Should fetch fresh data
  184 |       const onlineResponse = await page.evaluate(async () => {
  185 |         const resp = await fetch('/data/manifest.json', { cache: 'no-store' });
  186 |         return {
  187 |           status: resp.status,
  188 |           isOffline: resp.headers.get('X-Offline-Response') === 'true'
  189 |         };
  190 |       });
  191 |       
  192 |       expect(onlineResponse.status).toBe(200);
  193 |       expect(onlineResponse.isOffline).not.toBe(true);
  194 |       
  195 |     } finally {
  196 |       await context.setOffline(false);
  197 |       server.kill();
  198 |     }
  199 |   });
  200 | 
  201 |   test('should not lose unsaved edits on SW update', async ({ page }) => {
  202 |     // Initialize vault and create a draft
  203 |     await page.goto('http://localhost:5173/#/settings');
  204 |     await page.waitForTimeout(500);
  205 |     
  206 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  207 |     await page.waitForTimeout(200);
  208 |     
  209 |     await page.locator('#password').fill(TEST_PASSWORD);
  210 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  211 |     await page.getByRole('button', { name: '确认初始化' }).click();
  212 |     
  213 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  214 |     
  215 |     // Go to diary create page
  216 |     await page.goto('http://localhost:5173/#/diary/create');
  217 |     await page.waitForTimeout(500);
  218 |     
  219 |     // Start typing (unsaved edits)
  220 |     await page.locator('#title').fill('测试未保存内容');
  221 |     await page.locator('#content').fill('这是一些未保存的内容，不应该在SW更新时丢失');
  222 |     
  223 |     // Simulate SW update becoming available
  224 |     // (In real scenario, new SW would be waiting)
  225 |     // Verify content still there
  226 |     await page.waitForTimeout(1000);
  227 |     
  228 |     const titleValue = await page.locator('#title').inputValue();
  229 |     const contentValue = await page.locator('#content').inputValue();
  230 |     
  231 |     expect(titleValue).toBe('测试未保存内容');
  232 |     expect(contentValue).toBe('这是一些未保存的内容，不应该在SW更新时丢失');
  233 |   });
  234 | 
  235 |   test('should coordinate upgrade across multiple windows', async ({ browser }) => {
  236 |     const context1 = await browser.newContext();
  237 |     const context2 = await browser.newContext();
  238 |     const page1 = await context1.newPage();
  239 |     const page2 = await context2.newPage();
  240 |     
  241 |     try {
  242 |       // Open same app in two windows
  243 |       await page1.goto('http://localhost:5173/#/');
  244 |       await page2.goto('http://localhost:5173/#/');
  245 |       
  246 |       await page1.waitForTimeout(1000);
  247 |       await page2.waitForTimeout(1000);
  248 |       
  249 |       // Check both have SW
  250 |       const sw1 = await page1.evaluate(() => 'serviceWorker' in navigator);
  251 |       const sw2 = await page2.evaluate(() => 'serviceWorker' in navigator);
  252 |       
  253 |       expect(sw1).toBe(true);
  254 |       expect(sw2).toBe(true);
  255 |       
  256 |       // Both windows should see same version
  257 |       const version1 = await page1.evaluate(() => {
  258 |         return document.documentElement.getAttribute('data-theme');
  259 |       });
  260 |       
  261 |       const version2 = await page2.evaluate(() => {
  262 |         return document.documentElement.getAttribute('data-theme');
  263 |       });
  264 |       
  265 |       expect(version1).toBeTruthy();
  266 |       expect(version2).toBeTruthy();
  267 |       
  268 |     } finally {
  269 |       await context1.close();
  270 |       await context2.close();
  271 |     }
  272 |   });
  273 | 
  274 |   test('should verify SW script is not browser-cached', async ({ page }) => {
  275 |     // Check that /sw.js has proper cache headers
  276 |     const response = await page.goto('http://localhost:5173/sw.js');
```