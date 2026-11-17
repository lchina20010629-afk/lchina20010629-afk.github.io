# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes.spec.ts >> Dark Mode Contrast >> should have readable text in dark mode
- Location: e2e/themes.spec.ts:249:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('生活日记')
Expected: visible
Error: strict mode violation: getByText('生活日记') resolved to 3 elements:
    1) <span>生活日记</span> aka getByRole('link', { name: '生活日记' })
    2) <span class="mobile-nav-label">生活日记</span> aka getByText('生活日记').nth(1)
    3) <h3>生活日记</h3> aka getByRole('heading', { name: '生活日记' })

Call log:
  - Expect "toBeVisible" getByText('生活日记') with timeout 5000ms
  - waiting for getByText('生活日记')

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
  163 |         // Check no horizontal overflow
  164 |         const overflow = await page.evaluate(() => {
  165 |           return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  166 |         });
  167 |         expect(overflow).toBe(false);
  168 |       }
  169 |     });
  170 |   }
  171 | });
  172 | 
  173 | test.describe('Theme Screenshots', () => {
  174 |   for (const palette of palettes) {
  175 |     for (const mode of modes) {
  176 |       test(`should capture ${palette}-${mode} at mobile width`, async ({ page }) => {
  177 |         await page.setViewportSize({ width: 375, height: 667 });
  178 |         
  179 |         // Set theme
  180 |         await page.goto('/#/settings');
  181 |         await page.waitForTimeout(500);
  182 |         
  183 |         // Set palette
  184 |         await page.locator(`.palette-card[data-palette="${palette}"]`).click();
  185 |         await page.waitForTimeout(200);
  186 |         
  187 |         // Set mode
  188 |         const modeButton = mode === 'light' 
  189 |           ? page.getByRole('button', { name: /浅色/ })
  190 |           : page.getByRole('button', { name: /深色/ });
  191 |         await modeButton.click();
  192 |         await page.waitForTimeout(200);
  193 |         
  194 |         // Go to homepage and capture
  195 |         await page.goto('/#/');
  196 |         await page.waitForTimeout(1000);
  197 |         
  198 |         await page.screenshot({ 
  199 |           path: `/opt/cursor/artifacts/theme-${palette}-${mode}-mobile.png`,
  200 |           fullPage: false
  201 |         });
  202 |       });
  203 |     }
  204 |   }
  205 |   
  206 |   test('should capture desktop view with all palettes', async ({ page }) => {
  207 |     await page.setViewportSize({ width: 1280, height: 720 });
  208 |     
  209 |     for (const palette of palettes) {
  210 |       await page.goto('/#/settings');
  211 |       await page.waitForTimeout(500);
  212 |       
  213 |       await page.locator(`.palette-card[data-palette="${palette}"]`).click();
  214 |       await page.waitForTimeout(200);
  215 |       
  216 |       await page.goto('/#/');
  217 |       await page.waitForTimeout(1000);
  218 |       
  219 |       await page.screenshot({ 
  220 |         path: `/opt/cursor/artifacts/theme-${palette}-light-desktop.png`,
  221 |         fullPage: false
  222 |       });
  223 |     }
  224 |   });
  225 | });
  226 | 
  227 | test.describe('Touch Targets', () => {
  228 |   test('should have minimum 44px touch targets on mobile', async ({ page }) => {
  229 |     await page.setViewportSize({ width: 375, height: 667 });
  230 |     await page.goto('/#/');
  231 |     await page.waitForTimeout(1000);
  232 |     
  233 |     // Check navigation buttons
  234 |     const navButtons = page.locator('nav button, nav a');
  235 |     const count = await navButtons.count();
  236 |     
  237 |     for (let i = 0; i < count; i++) {
  238 |       const button = navButtons.nth(i);
  239 |       const box = await button.boundingBox();
  240 |       
  241 |       if (box) {
  242 |         expect(box.height).toBeGreaterThanOrEqual(44);
  243 |       }
  244 |     }
  245 |   });
  246 | });
  247 | 
  248 | test.describe('Dark Mode Contrast', () => {
  249 |   test('should have readable text in dark mode', async ({ page }) => {
  250 |     await page.goto('/#/settings');
  251 |     await page.waitForTimeout(500);
  252 |     
  253 |     // Switch to dark mode
  254 |     await page.getByRole('button', { name: /深色/ }).click();
  255 |     await page.waitForTimeout(200);
  256 |     
  257 |     // Check various text elements are visible
  258 |     await page.goto('/#/');
  259 |     await page.waitForTimeout(1000);
  260 |     
  261 |     const mainH1 = page.locator('main h1, .page-header h1').first();
  262 |     await expect(mainH1).toBeVisible();
> 263 |     await expect(page.getByText('生活日记')).toBeVisible();
      |                                          ^ Error: expect(locator).toBeVisible() failed
  264 |     await expect(page.getByText('成长学习')).toBeVisible();
  265 |     
  266 |     // Verify dark theme attribute is set
  267 |     const themeAttr = await page.evaluate(() => 
  268 |       document.documentElement.getAttribute('data-theme')
  269 |     );
  270 |     expect(themeAttr).toBe('dark');
  271 |     
  272 |     // Verify dark background color is applied (should have low RGB values)
  273 |     const bgColor = await page.evaluate(() => {
  274 |       return window.getComputedStyle(document.documentElement).backgroundColor;
  275 |     });
  276 |     
  277 |     // Background should be dark (RGB values less than 100)
  278 |     const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  279 |     if (rgbMatch) {
  280 |       const r = parseInt(rgbMatch[1]);
  281 |       const g = parseInt(rgbMatch[2]);
  282 |       const b = parseInt(rgbMatch[3]);
  283 |       expect(Math.max(r, g, b)).toBeLessThan(100);
  284 |     }
  285 |   });
  286 | });
  287 | 
```