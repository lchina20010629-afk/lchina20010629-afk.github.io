# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diary.spec.ts >> Encrypted Diary Flow >> creates diary with Unicode content and photo
- Location: e2e/diary.spec.ts:37:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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
  1   | import { test, expect } from '@playwright/test';
  2   | import { join } from 'path';
  3   | 
  4   | /**
  5   |  * E2E tests for encrypted diary creation, viewing, editing, and deletion
  6   |  */
  7   | 
  8   | test.describe('Encrypted Diary Flow', () => {
  9   |   const testPassword = 'TestPassword123!@#Strong';
  10  |   
  11  |   test.beforeEach(async ({ page, context }) => {
  12  |     await context.clearCookies();
  13  |     await page.goto('http://localhost:5173/settings');
  14  |     
  15  |     // Clear IndexedDB
  16  |     await page.evaluate(async () => {
  17  |       const dbs = await indexedDB.databases();
  18  |       for (const db of dbs) {
  19  |         if (db.name) {
  20  |           indexedDB.deleteDatabase(db.name);
  21  |         }
  22  |       }
  23  |       localStorage.clear();
  24  |       sessionStorage.clear();
  25  |     });
  26  |     
  27  |     await page.reload();
  28  |     
  29  |     // Initialize vault
> 30  |     await page.getByRole('button', { name: '初始化保险库' }).click();
      |                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  31  |     await page.locator('#password').fill(testPassword);
  32  |     await page.locator('#confirm-password').fill(testPassword);
  33  |     await page.getByRole('button', { name: '确认初始化' }).click();
  34  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  35  |   });
  36  | 
  37  |   test('creates diary with Unicode content and photo', async ({ page }) => {
  38  |     // Use client-side navigation to preserve in-memory vault state
  39  |     await page.click('a[href="/diary"]');
  40  |     await page.waitForTimeout(200);
  41  |     await page.getByText('创建日记').click();
  42  |     
  43  |     // Wait for form to load
  44  |     await page.waitForSelector('#date');
  45  |     
  46  |     const today = new Date().toISOString().split('T')[0];
  47  |     await page.locator('#date').fill(today);
  48  |     await page.locator('#title').fill('测试日记 🌟');
  49  |     await page.locator('#content').fill('今天天气很好，心情也不错。\n这是第二行内容。\n包含中文、emoji 😊 和 English mixed text.');
  50  |     await page.locator('#mood').fill('开心');
  51  |     await page.locator('#weather').fill('晴天');
  52  |     await page.locator('#tags').fill('测试, 心情, Unicode');
  53  |     
  54  |     // Skip image upload for now - requires valid image file
  55  |     // await page.locator('#images').setInputFiles(testImagePath);
  56  |     
  57  |     await page.getByRole('button', { name: '保存' }).click();
  58  |     
  59  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`, { timeout: 10000 });
  60  |     await expect(page.getByText('测试日记 🌟')).toBeVisible();
  61  |   });
  62  | 
  63  |   test('views and edits existing diary entry', async ({ page }) => {
  64  |     // Create entry first - use client-side navigation
  65  |     await page.click('a[href="/diary"]');
  66  |     await page.waitForTimeout(200);
  67  |     await page.getByText('创建日记').click();
  68  |     const today = new Date().toISOString().split('T')[0];
  69  |     await page.locator('#date').fill(today);
  70  |     await page.locator('#title').fill('Original Title');
  71  |     await page.locator('#content').fill('Original content here.');
  72  |     await page.getByRole('button', { name: '保存' }).click();
  73  |     
  74  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  75  |     await expect(page.getByText('Original Title')).toBeVisible();
  76  |     
  77  |     // Edit it
  78  |     await page.getByRole('button', { name: '编辑' }).click();
  79  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}/edit`);
  80  |     
  81  |     await page.locator('#title').fill('Updated Title');
  82  |     await page.locator('#content').fill('Updated content with changes.');
  83  |     await page.getByRole('button', { name: '保存' }).click();
  84  |     
  85  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  86  |     await expect(page.getByText('Updated Title')).toBeVisible();
  87  |     await expect(page.getByText('Updated content with changes.')).toBeVisible();
  88  |   });
  89  | 
  90  |   test('deletes diary entry', async ({ page }) => {
  91  |     // Create entry - use client-side navigation
  92  |     await page.click('a[href="/diary"]');
  93  |     await page.waitForTimeout(200);
  94  |     await page.getByText('创建日记').click();
  95  |     const today = new Date().toISOString().split('T')[0];
  96  |     await page.locator('#date').fill(today);
  97  |     await page.locator('#title').fill('Entry to Delete');
  98  |     await page.locator('#content').fill('This will be deleted.');
  99  |     await page.getByRole('button', { name: '保存' }).click();
  100 |     
  101 |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  102 |     
  103 |     // Set up dialog handler before clicking delete
  104 |     page.on('dialog', dialog => dialog.accept());
  105 |     
  106 |     await page.getByRole('button', { name: '删除' }).click();
  107 |     
  108 |     await expect(page).toHaveURL('http://localhost:5173/diary');
  109 |   });
  110 | 
  111 |   test('locked vault blocks diary access', async ({ page }) => {
  112 |     // Lock vault - use client-side navigation
  113 |     await page.click('a[href="/settings"]');
  114 |     await page.waitForTimeout(200);
  115 |     await page.getByRole('button', { name: '锁定' }).click();
  116 |     
  117 |     // Navigate to diary via link
  118 |     await page.click('a[href="/diary"]');
  119 |     await page.waitForTimeout(200);
  120 |     await expect(page.getByText('请先解锁保险库')).toBeVisible();
  121 |   });
  122 | });
  123 | 
```