# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vault.spec.ts >> Vault Management >> initializes vault with strong password
- Location: e2e/vault.spec.ts:29:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('保险库未初始化')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('保险库未初始化') with timeout 5000ms
  - waiting for getByText('保险库未初始化')

```

```yaml
- complementary:
  - heading "个人成长" [level=1]
  - paragraph: 生活 • 学习 • 成长
  - navigation:
    - link "今日总览":
      - /url: "#/"
      - img
      - text: 今日总览
    - link "生活日记":
      - /url: "#/diary"
      - img
      - text: 生活日记
    - link "成长学习":
      - /url: "#/learning"
      - img
      - text: 成长学习
    - link "总结回顾":
      - /url: "#/reviews"
      - img
      - text: 总结回顾
    - link "设置":
      - /url: "#/settings"
      - img
      - text: 设置
  - 'button "当前主题: 跟随系统"':
    - img
- main:
  - heading "今日总览" [level=1]
  - paragraph: 2026-11-17 • 今天
  - img
  - heading "生活日记" [level=3]
  - paragraph: 记录今天的点滴
  - link "查看日记":
    - /url: "#/diary"
  - img
  - heading "成长学习" [level=3]
  - paragraph: 今日学习进度
  - link "查看学习":
    - /url: "#/learning"
  - img
  - heading "总结回顾" [level=3]
  - paragraph: 周/月/年度回顾
  - link "查看总结":
    - /url: "#/reviews"
  - img
  - heading "暂无数据" [level=3]
  - paragraph: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
  - button "前往设置"
  - heading "📅 外部自动化流程说明" [level=4]
  - paragraph: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
  - list:
    - listitem: 每天 10:30 - 课程准备
    - listitem: 每天 23:30 - 日记整理润色
    - listitem: 每周日 - 周总结
    - listitem: 每月最后一天 - 月总结
    - listitem: 12月31日 - 年终总结
  - paragraph: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
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
> 30 |     await expect(page.getByText('保险库未初始化')).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
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
  57 |     await page.getByRole('button', { name: '初始化保险库' }).click();
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