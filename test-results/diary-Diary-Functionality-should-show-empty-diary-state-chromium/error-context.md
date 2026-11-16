# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diary.spec.ts >> Diary Functionality >> should show empty diary state
- Location: e2e/diary.spec.ts:32:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=保险库已初始化') to be visible

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - complementary [ref=f1e4]:
    - generic [ref=f1e5]:
      - heading "个人成长" [level=1] [ref=f1e6]
      - paragraph [ref=f1e7]: 生活 • 学习 • 成长
    - navigation [ref=f1e8]:
      - link "今日总览" [ref=f1e9] [cursor=pointer]:
        - /url: /
      - link "生活日记" [ref=f1e14] [cursor=pointer]:
        - /url: /diary
      - link "成长学习" [ref=f1e18] [cursor=pointer]:
        - /url: /learning
      - link "总结回顾" [ref=f1e22] [cursor=pointer]:
        - /url: /reviews
      - link "设置" [ref=f1e27] [cursor=pointer]:
        - /url: /settings
    - 'button "当前主题: 跟随系统" [ref=f1e33] [cursor=pointer]'
  - main [ref=f1e36]:
    - generic [ref=f1e37]:
      - generic [ref=f1e38]:
        - heading "设置" [level=1] [ref=f1e39]
        - paragraph [ref=f1e40]: 管理您的个人数据和偏好
      - generic [ref=f1e41]:
        - heading "🔒 保险库状态" [level=2] [ref=f1e42]
        - generic [ref=f1e44]:
          - generic [ref=f1e47]:
            - heading "保险库已解锁" [level=3] [ref=f1e48]
            - paragraph [ref=f1e49]: 您可以查看和编辑加密数据
          - button "锁定" [ref=f1e50] [cursor=pointer]
      - generic [ref=f1e54]:
        - heading "ℹ️ 隐私与安全说明" [level=2] [ref=f1e55]
        - list [ref=f1e57]:
          - listitem [ref=f1e58]: ✅ 所有个人数据使用 AES-256-GCM 加密
          - listitem [ref=f1e59]: ✅ 密钥派生使用 PBKDF2-SHA256 (600,000 次迭代)
          - listitem [ref=f1e60]: ✅ 数据仅保存在当前浏览器的 IndexedDB 中
          - listitem [ref=f1e61]: ⚠️ 公开的 GitHub 仓库仅包含加密后的密文
          - listitem [ref=f1e62]: ⚠️ 弱密码可能被离线暴力破解，请使用强密码
          - listitem [ref=f1e63]: ⚠️ 浏览器清除数据会导致本地内容丢失
          - listitem [ref=f1e64]: 📦 建议定期导出加密备份到安全位置
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
> 29 |     await page.waitForSelector('text=保险库已初始化');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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
  96 |     expect(newTheme).not.toBe(initialTheme);
  97 |   });
  98 | });
  99 | 
```