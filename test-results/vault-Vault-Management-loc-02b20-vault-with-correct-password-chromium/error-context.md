# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vault.spec.ts >> Vault Management >> locks and unlocks vault with correct password
- Location: e2e/vault.spec.ts:55:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '初始化保险库' })

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
        - /url: "#/"
      - link "生活日记" [ref=f1e14] [cursor=pointer]:
        - /url: "#/diary"
      - link "成长学习" [ref=f1e18] [cursor=pointer]:
        - /url: "#/learning"
      - link "总结回顾" [ref=f1e22] [cursor=pointer]:
        - /url: "#/reviews"
      - link "设置" [ref=f1e27] [cursor=pointer]:
        - /url: "#/settings"
    - 'button "当前主题: 跟随系统" [ref=f1e33] [cursor=pointer]'
  - main [ref=f1e36]:
    - generic [ref=f1e37]:
      - generic [ref=f1e39]:
        - heading "今日总览" [level=1] [ref=f1e40]
        - paragraph [ref=f1e41]: 2026-11-17 • 今天
      - generic [ref=f1e42]:
        - generic [ref=f1e43]:
          - heading "生活日记" [level=3] [ref=f1e47]
          - paragraph [ref=f1e48]: 记录今天的点滴
          - link "查看日记" [ref=f1e49] [cursor=pointer]:
            - /url: "#/diary"
        - generic [ref=f1e50]:
          - heading "成长学习" [level=3] [ref=f1e54]
          - paragraph [ref=f1e55]: 今日学习进度
          - link "查看学习" [ref=f1e56] [cursor=pointer]:
            - /url: "#/learning"
        - generic [ref=f1e57]:
          - heading "总结回顾" [level=3] [ref=f1e62]
          - paragraph [ref=f1e63]: 周/月/年度回顾
          - link "查看总结" [ref=f1e64] [cursor=pointer]:
            - /url: "#/reviews"
      - generic [ref=f1e66]:
        - heading "暂无数据" [level=3] [ref=f1e71]
        - paragraph [ref=f1e72]: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
        - button "前往设置" [ref=f1e73] [cursor=pointer]
      - generic [ref=f1e74]:
        - heading "📅 外部自动化流程说明" [level=4] [ref=f1e75]
        - paragraph [ref=f1e76]: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
        - list [ref=f1e77]:
          - listitem [ref=f1e78]: 每天 10:30 - 课程准备
          - listitem [ref=f1e79]: 每天 23:30 - 日记整理润色
          - listitem [ref=f1e80]: 每周日 - 周总结
          - listitem [ref=f1e81]: 每月最后一天 - 月总结
          - listitem [ref=f1e82]: 12月31日 - 年终总结
        - paragraph [ref=f1e83]: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * E2E tests for vault initialization and unlock/lock functionality
  5  |  * Tests run against the dev server at http://localhost:5173
  6  |  */
  7  | 
  8  | test.describe('Vault Management', () => {
  9  |   test.beforeEach(async ({ page, context }) => {
  10 |     await context.clearCookies();
  11 |     await page.goto('http://localhost:5173/settings');
  12 |     
  13 |     // Clear IndexedDB
  14 |     await page.evaluate(async () => {
  15 |       const dbs = await indexedDB.databases();
  16 |       for (const db of dbs) {
  17 |         if (db.name) {
  18 |           indexedDB.deleteDatabase(db.name);
  19 |         }
  20 |       }
  21 |       localStorage.clear();
  22 |       sessionStorage.clear();
  23 |     });
  24 |     
  25 |     // Reload to reset state
  26 |     await page.reload();
  27 |   });
  28 | 
  29 |   test('initializes vault with strong password', async ({ page }) => {
  30 |     await expect(page.getByText('保险库未初始化')).toBeVisible();
  31 |     
  32 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  33 |     
  34 |     const password = 'TestPassword123!@#Strong';
  35 |     await page.locator('#password').fill(password);
  36 |     await page.locator('#confirm-password').fill(password);
  37 |     
  38 |     await page.getByRole('button', { name: '确认初始化' }).click();
  39 |     
  40 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  41 |   });
  42 | 
  43 |   test('rejects weak password during initialization', async ({ page }) => {
  44 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  45 |     
  46 |     const weakPassword = '12345';
  47 |     await page.locator('#password').fill(weakPassword);
  48 |     await page.locator('#confirm-password').fill(weakPassword);
  49 |     
  50 |     await page.getByRole('button', { name: '确认初始化' }).click();
  51 |     
  52 |     await expect(page.getByText(/密码强度不足/)).toBeVisible();
  53 |   });
  54 | 
  55 |   test('locks and unlocks vault with correct password', async ({ page }) => {
  56 |     // Initialize first
> 57 |     await page.getByRole('button', { name: '初始化保险库' }).click();
     |                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  58 |     const password = 'TestPassword123!@#Strong';
  59 |     await page.locator('#password').fill(password);
  60 |     await page.locator('#confirm-password').fill(password);
  61 |     await page.getByRole('button', { name: '确认初始化' }).click();
  62 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  63 | 
  64 |     // Lock it
  65 |     await page.getByRole('button', { name: '锁定' }).click();
  66 |     await expect(page.getByText('保险库已锁定')).toBeVisible();
  67 | 
  68 |     // Unlock with correct password - first open the form
  69 |     await page.getByRole('button', { name: '解锁' }).first().click();
  70 |     await page.locator('#unlock-password').fill(password);
  71 |     // Then submit the form
  72 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  73 |     await expect(page.getByText('保险库已解锁')).toBeVisible();
  74 |   });
  75 | 
  76 |   test('rejects wrong password during unlock', async ({ page }) => {
  77 |     // Initialize
  78 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  79 |     const password = 'TestPassword123!@#Strong';
  80 |     await page.locator('#password').fill(password);
  81 |     await page.locator('#confirm-password').fill(password);
  82 |     await page.getByRole('button', { name: '确认初始化' }).click();
  83 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  84 | 
  85 |     // Lock
  86 |     await page.getByRole('button', { name: '锁定' }).click();
  87 | 
  88 |     // Try wrong password - first open form
  89 |     await page.getByRole('button', { name: '解锁' }).first().click();
  90 |     await page.locator('#unlock-password').fill('WrongPassword123!');
  91 |     // Submit form
  92 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  93 |     await expect(page.getByText('密码错误')).toBeVisible();
  94 |   });
  95 | });
  96 | 
```