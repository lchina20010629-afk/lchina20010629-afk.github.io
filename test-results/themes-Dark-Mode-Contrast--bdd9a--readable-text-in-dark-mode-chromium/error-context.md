# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes.spec.ts >> Dark Mode Contrast >> should have readable text in dark mode
- Location: e2e/themes.spec.ts:248:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Error: strict mode violation: locator('h1') resolved to 2 elements:
    1) <h1 class="sidebar-title">个人成长</h1> aka getByRole('heading', { name: '个人成长' })
    2) <h1>今日总览</h1> aka getByRole('heading', { name: '今日总览' })

Call log:
  - Expect "toBeVisible" locator('h1') with timeout 5000ms
  - waiting for locator('h1')

```

# Page snapshot

```yaml
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
    - 'button "当前主题: 深色" [ref=e33] [cursor=pointer]'
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
```

# Test source

```ts
  160 |         await expect(page.locator('h1')).toContainText(title, { timeout: 3000 });
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
> 260 |     await expect(page.locator('h1')).toBeVisible();
      |                                      ^ Error: expect(locator).toBeVisible() failed
  261 |     await expect(page.getByText('生活日记')).toBeVisible();
  262 |     await expect(page.getByText('成长学习')).toBeVisible();
  263 |     
  264 |     // Verify dark theme colors are applied
  265 |     const bgColor = await page.evaluate(() => {
  266 |       return window.getComputedStyle(document.body).backgroundColor;
  267 |     });
  268 |     
  269 |     // Dark background should be dark (low RGB values)
  270 |     expect(bgColor).toMatch(/rgb\([\d\s,]*[0-5]\d/); // Check for low RGB values
  271 |   });
  272 | });
  273 | 
```