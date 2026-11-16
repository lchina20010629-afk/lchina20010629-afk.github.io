# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup.spec.ts >> Backup and Import >> exports and imports diary data
- Location: e2e/backup.spec.ts:42:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('Test Export Entry')

```

# Page snapshot

```yaml
- generic [ref=f6e3]:
  - complementary [ref=f6e4]:
    - generic [ref=f6e5]:
      - heading "个人成长" [level=1] [ref=f6e6]
      - paragraph [ref=f6e7]: 生活 • 学习 • 成长
    - navigation [ref=f6e8]:
      - link "今日总览" [ref=f6e9] [cursor=pointer]:
        - /url: /
      - link "生活日记" [ref=f6e14] [cursor=pointer]:
        - /url: /diary
      - link "成长学习" [ref=f6e18] [cursor=pointer]:
        - /url: /learning
      - link "总结回顾" [ref=f6e22] [cursor=pointer]:
        - /url: /reviews
      - link "设置" [ref=f6e27] [cursor=pointer]:
        - /url: /settings
    - 'button "当前主题: 跟随系统" [ref=f6e33] [cursor=pointer]'
  - main [ref=f6e36]:
    - generic [ref=f6e37]:
      - generic [ref=f6e38]:
        - generic [ref=f6e39]:
          - heading "生活日记" [level=1] [ref=f6e40]
          - paragraph [ref=f6e41]: 记录每一天的点滴瞬间
        - link "创建日记" [ref=f6e42] [cursor=pointer]:
          - /url: /diary/create
      - link "2026-11-16 点击查看详情" [ref=f6e45] [cursor=pointer]:
        - /url: /diary/2026-11-16
        - generic [ref=f6e46]: 2026-11-16
        - generic [ref=f6e47]: 点击查看详情
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
  35  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  36  |     await page.locator('#password').fill(testPassword);
  37  |     await page.locator('#confirm-password').fill(testPassword);
  38  |     await page.getByRole('button', { name: '确认初始化' }).click();
  39  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  40  |   });
  41  | 
  42  |   test('exports and imports diary data', async ({ page, context }) => {
  43  |     // Create diary entry
  44  |     await page.goto('http://localhost:5173/diary/create');
  45  |     const today = new Date().toISOString().split('T')[0];
  46  |     await page.locator('#date').fill(today);
  47  |     await page.locator('#title').fill('Test Export Entry');
  48  |     await page.locator('#content').fill('Content for export test.');
  49  |     await page.getByRole('button', { name: '保存' }).click();
  50  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  51  | 
  52  |     // Export backup
  53  |     await page.goto('http://localhost:5173/settings');
  54  |     
  55  |     const downloadPromise = page.waitForEvent('download');
  56  |     await page.getByRole('button', { name: '导出备份' }).click();
  57  |     const download = await downloadPromise;
  58  |     
  59  |     const downloadPath = join(__dirname, '../temp-backup.json');
  60  |     await download.saveAs(downloadPath);
  61  | 
  62  |     // Clear storage - navigate to app first to get proper context
  63  |     await context.clearCookies();
  64  |     await page.goto('http://localhost:5173');
  65  |     
  66  |     await page.evaluate(async () => {
  67  |       // Close any open DB connections
  68  |       sessionStorage.clear();
  69  |       localStorage.clear();
  70  |       
  71  |       // Delete databases
  72  |       const dbs = await indexedDB.databases();
  73  |       for (const db of dbs) {
  74  |         if (db.name) {
  75  |           indexedDB.deleteDatabase(db.name);
  76  |         }
  77  |       }
  78  |     });
  79  |     
  80  |     await page.waitForTimeout(500);
  81  | 
  82  |     // Re-initialize vault with same password
  83  |     await page.goto('http://localhost:5173/settings');
  84  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  85  |     await page.locator('#password').fill(testPassword);
  86  |     await page.locator('#confirm-password').fill(testPassword);
  87  |     await page.getByRole('button', { name: '确认初始化' }).click();
  88  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  89  | 
  90  |     // Import backup
  91  |     await page.locator('input[type="file"]').setInputFiles(downloadPath);
  92  |     await expect(page.getByText(/导入成功.*1 条新记录/)).toBeVisible({ timeout: 5000 });
  93  | 
  94  |     // Verify imported data
  95  |     await page.goto('http://localhost:5173/diary');
> 96  |     await page.getByText('Test Export Entry').click();
      |                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  97  |     await expect(page.getByText('Content for export test.')).toBeVisible();
  98  |   });
  99  | 
  100 |   test('rejects import with wrong password', async ({ page }) => {
  101 |     // Export with current password
  102 |     await page.goto('http://localhost:5173/settings');
  103 |     const downloadPromise = page.waitForEvent('download');
  104 |     await page.getByRole('button', { name: '导出备份' }).click();
  105 |     const download = await downloadPromise;
  106 |     const downloadPath = join(__dirname, '../temp-wrong-pw.json');
  107 |     await download.saveAs(downloadPath);
  108 | 
  109 |     // Lock and unlock with wrong password would fail, so we simulate by trying to import
  110 |     // a backup made with a different password (we'll create a new vault)
  111 |     await page.getByRole('button', { name: '锁定' }).click();
  112 | 
  113 |     // Change context - in reality you'd init with different password
  114 |     // For this test, we just verify the error handling exists
  115 |     // The import will fail because the backup is encrypted with testPassword
  116 |   });
  117 | 
  118 |   test('preserves existing data during import', async ({ page, context }) => {
  119 |     // Create first entry
  120 |     await page.goto('http://localhost:5173/diary/create');
  121 |     const today = new Date().toISOString().split('T')[0];
  122 |     await page.locator('#date').fill(today);
  123 |     await page.locator('#title').fill('Existing Entry');
  124 |     await page.locator('#content').fill('Original content.');
  125 |     await page.getByRole('button', { name: '保存' }).click();
  126 | 
  127 |     // Export
  128 |     await page.goto('http://localhost:5173/settings');
  129 |     const downloadPromise = page.waitForEvent('download');
  130 |     await page.getByRole('button', { name: '导出备份' }).click();
  131 |     const download = await downloadPromise;
  132 |     const downloadPath = join(__dirname, '../temp-preserve.json');
  133 |     await download.saveAs(downloadPath);
  134 | 
  135 |     // Create second entry (not in backup)
  136 |     await page.goto('http://localhost:5173/diary/create');
  137 |     const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  138 |     await page.locator('#date').fill(yesterday);
  139 |     await page.locator('#title').fill('New Entry After Export');
  140 |     await page.locator('#content').fill('Should be preserved.');
  141 |     await page.getByRole('button', { name: '保存' }).click();
  142 | 
  143 |     // Import old backup
  144 |     await page.goto('http://localhost:5173/settings');
  145 |     await page.locator('input[type="file"]').setInputFiles(downloadPath);
  146 |     await expect(page.getByText(/跳过.*1 条已存在记录/)).toBeVisible({ timeout: 5000 });
  147 | 
  148 |     // Both entries should exist
  149 |     await page.goto('http://localhost:5173/diary');
  150 |     await expect(page.getByText('Existing Entry')).toBeVisible();
  151 |     await expect(page.getByText('New Entry After Export')).toBeVisible();
  152 |   });
  153 | });
  154 | 
```