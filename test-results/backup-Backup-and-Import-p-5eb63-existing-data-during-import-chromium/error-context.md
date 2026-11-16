# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup.spec.ts >> Backup and Import >> preserves existing data during import
- Location: e2e/backup.spec.ts:129:3

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
  2   | import { readFile } from 'fs/promises';
  3   | import { fileURLToPath } from 'url';
  4   | import { dirname, join } from 'path';
  5   | 
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = dirname(__filename);
  8   | 
  9   | /**
  10  |  * E2E tests for export/import encrypted backup functionality
  11  |  */
  12  | 
  13  | test.describe('Backup and Import', () => {
  14  |   const testPassword = 'TestPassword123!@#Strong';
  15  |   
  16  |   test.beforeEach(async ({ page, context }) => {
  17  |     await context.clearCookies();
  18  |     await page.goto('http://localhost:5173/settings');
  19  |     
  20  |     // Clear IndexedDB
  21  |     await page.evaluate(async () => {
  22  |       const dbs = await indexedDB.databases();
  23  |       for (const db of dbs) {
  24  |         if (db.name) {
  25  |           indexedDB.deleteDatabase(db.name);
  26  |         }
  27  |       }
  28  |       localStorage.clear();
  29  |       sessionStorage.clear();
  30  |     });
  31  |     
  32  |     await page.reload();
  33  |     
  34  |     // Initialize vault
> 35  |     await page.getByRole('button', { name: '初始化保险库' }).click();
      |                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  36  |     await page.locator('#password').fill(testPassword);
  37  |     await page.locator('#confirm-password').fill(testPassword);
  38  |     await page.getByRole('button', { name: '确认初始化' }).click();
  39  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  40  |   });
  41  | 
  42  |   test('exports and imports diary data', async ({ page, context }) => {
  43  |     // Create diary entry using client-side navigation
  44  |     await page.click('a[href="/diary"]');
  45  |     await page.waitForTimeout(200);
  46  |     await page.getByText('创建日记').click();
  47  |     const today = new Date().toISOString().split('T')[0];
  48  |     await page.locator('#date').fill(today);
  49  |     await page.locator('#title').fill('Test Export Entry');
  50  |     await page.locator('#content').fill('Content for export test.');
  51  |     await page.getByRole('button', { name: '保存' }).click();
  52  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  53  | 
  54  |     // Export backup using client-side navigation
  55  |     await page.click('a[href="/settings"]');
  56  |     await page.waitForTimeout(200);
  57  |     
  58  |     const downloadPromise = page.waitForEvent('download');
  59  |     await page.getByRole('button', { name: '导出备份' }).click();
  60  |     const download = await downloadPromise;
  61  |     
  62  |     const downloadPath = join(__dirname, '../temp-backup.json');
  63  |     await download.saveAs(downloadPath);
  64  | 
  65  |     // Clear storage - full page reload clears in-memory vault
  66  |     await page.reload();
  67  |     
  68  |     await page.evaluate(async () => {
  69  |       // Delete databases
  70  |       const dbs = await indexedDB.databases();
  71  |       for (const db of dbs) {
  72  |         if (db.name) {
  73  |           indexedDB.deleteDatabase(db.name);
  74  |         }
  75  |       }
  76  |       sessionStorage.clear();
  77  |       localStorage.clear();
  78  |     });
  79  |     
  80  |     await page.waitForTimeout(500);
  81  | 
  82  |     // Re-initialize vault with same password (full reload required re-init)
  83  |     await page.reload();
  84  |     await page.click('a[href="/settings"]');
  85  |     await page.waitForTimeout(200);
  86  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  87  |     await page.locator('#password').fill(testPassword);
  88  |     await page.locator('#confirm-password').fill(testPassword);
  89  |     await page.getByRole('button', { name: '确认初始化' }).click();
  90  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  91  | 
  92  |     // Import backup
  93  |     await page.locator('input[type="file"]').setInputFiles(downloadPath);
  94  |     await expect(page.getByText(/导入成功.*1 条新记录/)).toBeVisible({ timeout: 5000 });
  95  | 
  96  |     // Verify imported data using client-side navigation
  97  |     await page.click('a[href="/diary"]');
  98  |     await page.waitForTimeout(500); // Wait for list to load
  99  |     
  100 |     // Diary list shows dates, not titles - click on the date
  101 |     const dateLink = page.locator(`a[href="/diary/${today}"]`);
  102 |     await expect(dateLink).toBeVisible({ timeout: 5000 });
  103 |     await dateLink.click();
  104 |     
  105 |     // Now check the detail page for title and content
  106 |     await expect(page.getByText('Test Export Entry')).toBeVisible();
  107 |     await expect(page.getByText('Content for export test.')).toBeVisible();
  108 |   });
  109 | 
  110 |   test('rejects import with wrong password', async ({ page }) => {
  111 |     // Export with current password using client-side navigation
  112 |     await page.click('a[href="/settings"]');
  113 |     await page.waitForTimeout(200);
  114 |     const downloadPromise = page.waitForEvent('download');
  115 |     await page.getByRole('button', { name: '导出备份' }).click();
  116 |     const download = await downloadPromise;
  117 |     const downloadPath = join(__dirname, '../temp-wrong-pw.json');
  118 |     await download.saveAs(downloadPath);
  119 | 
  120 |     // Lock and unlock with wrong password would fail, so we simulate by trying to import
  121 |     // a backup made with a different password (we'll create a new vault)
  122 |     await page.getByRole('button', { name: '锁定' }).click();
  123 | 
  124 |     // Change context - in reality you'd init with different password
  125 |     // For this test, we just verify the error handling exists
  126 |     // The import will fail because the backup is encrypted with testPassword
  127 |   });
  128 | 
  129 |   test('preserves existing data during import', async ({ page, context }) => {
  130 |     // Create first entry using client-side navigation
  131 |     await page.click('a[href="/diary"]');
  132 |     await page.waitForTimeout(200);
  133 |     await page.getByText('创建日记').click();
  134 |     const today = new Date().toISOString().split('T')[0];
  135 |     await page.locator('#date').fill(today);
```