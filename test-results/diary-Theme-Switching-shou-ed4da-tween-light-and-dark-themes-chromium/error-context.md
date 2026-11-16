# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diary.spec.ts >> Theme Switching >> should toggle between light and dark themes
- Location: e2e/diary.spec.ts:77:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "light"
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
        - /url: /
      - link "生活日记" [ref=e14] [cursor=pointer]:
        - /url: /diary
      - link "成长学习" [ref=e18] [cursor=pointer]:
        - /url: /learning
      - link "总结回顾" [ref=e22] [cursor=pointer]:
        - /url: /reviews
      - link "设置" [ref=e27] [cursor=pointer]:
        - /url: /settings
    - 'button "当前主题: 浅色" [active] [ref=e33] [cursor=pointer]'
  - main [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e43]:
        - heading "今日总览" [level=1] [ref=e44]
        - paragraph [ref=e45]: 2026-11-17 • 今天
      - generic [ref=e46]:
        - generic [ref=e47]:
          - heading "生活日记" [level=3] [ref=e51]
          - paragraph [ref=e52]: 记录今天的点滴
          - link "查看日记" [ref=e53] [cursor=pointer]:
            - /url: /diary
        - generic [ref=e54]:
          - heading "成长学习" [level=3] [ref=e58]
          - paragraph [ref=e59]: 今日学习进度
          - link "查看学习" [ref=e60] [cursor=pointer]:
            - /url: /learning
        - generic [ref=e61]:
          - heading "总结回顾" [level=3] [ref=e66]
          - paragraph [ref=e67]: 周/月/年度回顾
          - link "查看总结" [ref=e68] [cursor=pointer]:
            - /url: /reviews
      - generic [ref=e70]:
        - heading "暂无数据" [level=3] [ref=e75]
        - paragraph [ref=e76]: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
        - button "前往设置" [ref=e77] [cursor=pointer]
      - generic [ref=e78]:
        - heading "📅 外部自动化流程说明" [level=4] [ref=e79]
        - paragraph [ref=e80]: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
        - list [ref=e81]:
          - listitem [ref=e82]: 每天 10:30 - 课程准备
          - listitem [ref=e83]: 每天 23:30 - 日记整理润色
          - listitem [ref=e84]: 每周日 - 周总结
          - listitem [ref=e85]: 每月最后一天 - 月总结
          - listitem [ref=e86]: 12月31日 - 年终总结
        - paragraph [ref=e87]: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * E2E Test: Diary Functionality with Unicode and Photos
  5  |  * 
  6  |  * Tests gate #1: Add Unicode diary+photo, edit/save, view via calendar/detail,
  7  |  * verify IndexedDB encryption
  8  |  */
  9  | 
  10 | test.describe('Diary Functionality', () => {
  11 |   const strongPassword = 'TestP@ssw0rd!2024Long';
  12 | 
  13 |   test.beforeEach(async ({ page, context }) => {
  14 |     await context.clearCookies();
  15 |     await page.goto('/');
  16 |     
  17 |     // Clear and initialize vault
  18 |     await page.evaluate(() => {
  19 |       return indexedDB.deleteDatabase('life-growth-db');
  20 |     });
  21 |     
  22 |     // Initialize vault
  23 |     await page.goto('/settings');
  24 |     await page.waitForSelector('button:has-text("初始化保险库")');
  25 |     await page.click('button:has-text("初始化保险库")');
  26 |     await page.fill('input[type="password"]#password', strongPassword);
  27 |     await page.fill('input[type="password"]#confirm-password', strongPassword);
  28 |     await page.click('button[type="submit"]:has-text("确认初始化")');
  29 |     await page.waitForSelector('text=保险库已初始化');
  30 |   });
  31 | 
  32 |   test('should show empty diary state', async ({ page }) => {
  33 |     await page.goto('/diary');
  34 |     
  35 |     // Should show empty state
  36 |     await expect(page.locator('text=暂无日记')).toBeVisible();
  37 |   });
  38 | 
  39 |   test('should verify IndexedDB stores data encrypted', async ({ page }) => {
  40 |     await page.goto('/settings');
  41 |     
  42 |     // Check that vault_initialized setting exists
  43 |     const isEncrypted = await page.evaluate(async () => {
  44 |       const dbRequest = indexedDB.open('life-growth-db');
  45 |       return new Promise<boolean>((resolve) => {
  46 |         dbRequest.onsuccess = (event) => {
  47 |           const db = (event.target as IDBOpenDBRequest).result;
  48 |           const tx = db.transaction(['settings'], 'readonly');
  49 |           const store = tx.objectStore('settings');
  50 |           const getReq = store.get('vault_initialized');
  51 |           
  52 |           getReq.onsuccess = () => {
  53 |             // If vault is initialized, data should be encrypted
  54 |             resolve(getReq.result === true);
  55 |           };
  56 |           getReq.onerror = () => resolve(false);
  57 |         };
  58 |         dbRequest.onerror = () => resolve(false);
  59 |       });
  60 |     });
  61 |     
  62 |     expect(isEncrypted).toBe(true);
  63 |   });
  64 | 
  65 |   test('should handle Unicode content correctly', async ({ page }) => {
  66 |     const unicodeContent = '今天是美好的一天！🌟 学习了英语和泰语。包含特殊字符：♥♦♣♠';
  67 |     
  68 |     // Test that Unicode can be entered in input fields
  69 |     await page.goto('/diary');
  70 |     
  71 |     // For now, verify the page loads (actual diary form not implemented yet)
  72 |     await expect(page.locator('h1:has-text("生活日记")')).toBeVisible();
  73 |   });
  74 | });
  75 | 
  76 | test.describe('Theme Switching', () => {
  77 |   test('should toggle between light and dark themes', async ({ page }) => {
  78 |     await page.goto('/');
  79 |     
  80 |     // Find theme toggle button (in sidebar or mobile nav)
  81 |     const themeButton = page.locator('button[aria-label*="主题"]').first();
  82 |     
  83 |     // Initial theme
  84 |     const initialTheme = await page.evaluate(() => {
  85 |       return document.documentElement.getAttribute('data-theme');
  86 |     });
  87 |     
  88 |     // Click theme toggle
  89 |     await themeButton.click();
  90 |     
  91 |     // Theme should change
  92 |     const newTheme = await page.evaluate(() => {
  93 |       return document.documentElement.getAttribute('data-theme');
  94 |     });
  95 |     
> 96 |     expect(newTheme).not.toBe(initialTheme);
     |                          ^ Error: expect(received).not.toBe(expected) // Object.is equality
  97 |   });
  98 | });
  99 | 
```