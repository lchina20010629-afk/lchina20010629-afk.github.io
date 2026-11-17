# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes.spec.ts >> Mobile Responsive >> should render correctly at mobile-390 (390x844)
- Location: e2e/themes.spec.ts:134:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "今日总览"
Error: strict mode violation: locator('h1') resolved to 2 elements:
    1) <h1 class="sidebar-title">个人成长</h1> aka getByText('个人成长')
    2) <h1>今日总览</h1> aka getByRole('heading', { name: '今日总览' })

Call log:
  - Expect "toContainText" locator('h1') with timeout 3000ms
  - waiting for locator('h1')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - link "今日总览" [ref=e5] [cursor=pointer]:
      - /url: "#/"
    - link "生活日记" [ref=e10] [cursor=pointer]:
      - /url: "#/diary"
    - link "成长学习" [ref=e14] [cursor=pointer]:
      - /url: "#/learning"
    - link "总结回顾" [ref=e18] [cursor=pointer]:
      - /url: "#/reviews"
    - link "设置" [ref=e23] [cursor=pointer]:
      - /url: "#/settings"
  - main [ref=e28]:
    - generic [ref=e29]:
      - generic [ref=e31]:
        - heading "今日总览" [level=1] [ref=e32]
        - paragraph [ref=e33]: 2026-11-17 • 今天
      - generic [ref=e34]:
        - generic [ref=e35]:
          - heading "生活日记" [level=3] [ref=e39]
          - paragraph [ref=e40]: 记录今天的点滴
          - link "查看日记" [ref=e41] [cursor=pointer]:
            - /url: "#/diary"
        - generic [ref=e42]:
          - heading "成长学习" [level=3] [ref=e46]
          - paragraph [ref=e47]: 今日学习进度
          - link "查看学习" [ref=e48] [cursor=pointer]:
            - /url: "#/learning"
        - generic [ref=e49]:
          - heading "总结回顾" [level=3] [ref=e54]
          - paragraph [ref=e55]: 周/月/年度回顾
          - link "查看总结" [ref=e56] [cursor=pointer]:
            - /url: "#/reviews"
      - generic [ref=e58]:
        - heading "暂无数据" [level=3] [ref=e63]
        - paragraph [ref=e64]: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
        - button "前往设置" [ref=e65] [cursor=pointer]
      - generic [ref=e66]:
        - heading "📅 外部自动化流程说明" [level=4] [ref=e67]
        - paragraph [ref=e68]: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
        - list [ref=e69]:
          - listitem [ref=e70]: 每天 10:30 - 课程准备
          - listitem [ref=e71]: 每天 23:30 - 日记整理润色
          - listitem [ref=e72]: 每周日 - 周总结
          - listitem [ref=e73]: 每月最后一天 - 月总结
          - listitem [ref=e74]: 12月31日 - 年终总结
        - paragraph [ref=e75]: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
```

# Test source

```ts
  60  |     
  61  |     // Click dark mode button
  62  |     await page.getByRole('button', { name: /深色/ }).click();
  63  |     await page.waitForTimeout(200);
  64  |     
  65  |     let themeAttr = await page.evaluate(() => 
  66  |       document.documentElement.getAttribute('data-theme')
  67  |     );
  68  |     expect(themeAttr).toBe('dark');
  69  |     
  70  |     // Click light mode button
  71  |     await page.getByRole('button', { name: /浅色/ }).click();
  72  |     await page.waitForTimeout(200);
  73  |     
  74  |     themeAttr = await page.evaluate(() => 
  75  |       document.documentElement.getAttribute('data-theme')
  76  |     );
  77  |     expect(themeAttr).toBe('light');
  78  |   });
  79  | 
  80  |   test('should persist palette selection after reload', async ({ page }) => {
  81  |     await page.goto('/#/settings');
  82  |     await page.waitForTimeout(500);
  83  |     
  84  |     // Select light-purple palette
  85  |     await page.locator('.palette-card[data-palette="light-purple"]').click();
  86  |     await page.waitForTimeout(200);
  87  |     
  88  |     // Reload page
  89  |     await page.reload();
  90  |     await page.waitForTimeout(500);
  91  |     
  92  |     // Verify palette persisted
  93  |     const paletteAttr = await page.evaluate(() => 
  94  |       document.documentElement.getAttribute('data-palette')
  95  |     );
  96  |     expect(paletteAttr).toBe('light-purple');
  97  |     
  98  |     // Verify active state
  99  |     await expect(page.locator('.palette-card[data-palette="light-purple"]')).toHaveClass(/active/);
  100 |   });
  101 | 
  102 |   test('should not lose vault state when switching themes', async ({ page }) => {
  103 |     // Initialize vault
  104 |     await page.goto('/#/settings');
  105 |     await page.waitForTimeout(500);
  106 |     
  107 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  108 |     await page.waitForTimeout(200);
  109 |     
  110 |     await page.locator('#password').fill(TEST_PASSWORD);
  111 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  112 |     await page.getByRole('button', { name: '确认初始化' }).click();
  113 |     
  114 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  115 |     
  116 |     // Switch palette
  117 |     await page.locator('.palette-card[data-palette="fresh-blue"]').click();
  118 |     await page.waitForTimeout(200);
  119 |     
  120 |     // Verify vault still unlocked
  121 |     await expect(page.getByText('保险库已解锁')).toBeVisible();
  122 |     
  123 |     // Switch theme mode
  124 |     await page.getByRole('button', { name: /深色/ }).click();
  125 |     await page.waitForTimeout(200);
  126 |     
  127 |     // Verify vault still unlocked
  128 |     await expect(page.getByText('保险库已解锁')).toBeVisible();
  129 |   });
  130 | });
  131 | 
  132 | test.describe('Mobile Responsive', () => {
  133 |   for (const viewport of viewports) {
  134 |     test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
  135 |       await page.setViewportSize({ width: viewport.width, height: viewport.height });
  136 |       
  137 |       await page.goto('/#/');
  138 |       await page.waitForTimeout(1000);
  139 |       
  140 |       // Check no horizontal overflow
  141 |       const hasHorizontalScroll = await page.evaluate(() => {
  142 |         return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  143 |       });
  144 |       expect(hasHorizontalScroll).toBe(false);
  145 |       
  146 |       // Check all pages are accessible
  147 |       const pages = [
  148 |         { path: '/#/', title: '今日总览' },
  149 |         { path: '/#/diary', title: '生活日记' },
  150 |         { path: '/#/learning', title: '成长学习' },
  151 |         { path: '/#/reviews', title: '复盘反思' },
  152 |         { path: '/#/settings', title: '设置' },
  153 |       ];
  154 |       
  155 |       for (const { path, title } of pages) {
  156 |         await page.goto(path);
  157 |         await page.waitForTimeout(500);
  158 |         
  159 |         // Verify page loaded
> 160 |         await expect(page.locator('h1')).toContainText(title, { timeout: 3000 });
      |                                          ^ Error: expect(locator).toContainText(expected) failed
  161 |         
  162 |         // Check no horizontal overflow
  163 |         const overflow = await page.evaluate(() => {
  164 |           return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  165 |         });
  166 |         expect(overflow).toBe(false);
  167 |       }
  168 |     });
  169 |   }
  170 | });
  171 | 
  172 | test.describe('Theme Screenshots', () => {
  173 |   for (const palette of palettes) {
  174 |     for (const mode of modes) {
  175 |       test(`should capture ${palette}-${mode} at mobile width`, async ({ page }) => {
  176 |         await page.setViewportSize({ width: 375, height: 667 });
  177 |         
  178 |         // Set theme
  179 |         await page.goto('/#/settings');
  180 |         await page.waitForTimeout(500);
  181 |         
  182 |         // Set palette
  183 |         await page.locator(`.palette-card[data-palette="${palette}"]`).click();
  184 |         await page.waitForTimeout(200);
  185 |         
  186 |         // Set mode
  187 |         const modeButton = mode === 'light' 
  188 |           ? page.getByRole('button', { name: /浅色/ })
  189 |           : page.getByRole('button', { name: /深色/ });
  190 |         await modeButton.click();
  191 |         await page.waitForTimeout(200);
  192 |         
  193 |         // Go to homepage and capture
  194 |         await page.goto('/#/');
  195 |         await page.waitForTimeout(1000);
  196 |         
  197 |         await page.screenshot({ 
  198 |           path: `/opt/cursor/artifacts/theme-${palette}-${mode}-mobile.png`,
  199 |           fullPage: false
  200 |         });
  201 |       });
  202 |     }
  203 |   }
  204 |   
  205 |   test('should capture desktop view with all palettes', async ({ page }) => {
  206 |     await page.setViewportSize({ width: 1280, height: 720 });
  207 |     
  208 |     for (const palette of palettes) {
  209 |       await page.goto('/#/settings');
  210 |       await page.waitForTimeout(500);
  211 |       
  212 |       await page.locator(`.palette-card[data-palette="${palette}"]`).click();
  213 |       await page.waitForTimeout(200);
  214 |       
  215 |       await page.goto('/#/');
  216 |       await page.waitForTimeout(1000);
  217 |       
  218 |       await page.screenshot({ 
  219 |         path: `/opt/cursor/artifacts/theme-${palette}-light-desktop.png`,
  220 |         fullPage: false
  221 |       });
  222 |     }
  223 |   });
  224 | });
  225 | 
  226 | test.describe('Touch Targets', () => {
  227 |   test('should have minimum 44px touch targets on mobile', async ({ page }) => {
  228 |     await page.setViewportSize({ width: 375, height: 667 });
  229 |     await page.goto('/#/');
  230 |     await page.waitForTimeout(1000);
  231 |     
  232 |     // Check navigation buttons
  233 |     const navButtons = page.locator('nav button, nav a');
  234 |     const count = await navButtons.count();
  235 |     
  236 |     for (let i = 0; i < count; i++) {
  237 |       const button = navButtons.nth(i);
  238 |       const box = await button.boundingBox();
  239 |       
  240 |       if (box) {
  241 |         expect(box.height).toBeGreaterThanOrEqual(44);
  242 |       }
  243 |     }
  244 |   });
  245 | });
  246 | 
  247 | test.describe('Dark Mode Contrast', () => {
  248 |   test('should have readable text in dark mode', async ({ page }) => {
  249 |     await page.goto('/#/settings');
  250 |     await page.waitForTimeout(500);
  251 |     
  252 |     // Switch to dark mode
  253 |     await page.getByRole('button', { name: /深色/ }).click();
  254 |     await page.waitForTimeout(200);
  255 |     
  256 |     // Check various text elements are visible
  257 |     await page.goto('/#/');
  258 |     await page.waitForTimeout(500);
  259 |     
  260 |     await expect(page.locator('h1')).toBeVisible();
```