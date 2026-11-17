# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manifest.spec.ts >> CLI → Manifest → Browser Loader >> loads published diary entry from manifest
- Location: e2e/manifest.spec.ts:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a[href="#/diary/2026-11-16"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('a[href="#/diary/2026-11-16"]') with timeout 5000ms
  - waiting for locator('a[href="#/diary/2026-11-16"]')

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
  - heading "生活日记" [level=1]
  - paragraph: 记录每一天的点滴瞬间
  - link "创建日记":
    - /url: "#/diary/create"
    - img
    - text: 创建日记
  - link "2024-04-01 点击查看详情":
    - /url: "#/diary/2024-04-01"
    - text: 2024-04-01
    - img
    - text: 点击查看详情
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { join, dirname } from 'path';
  3   | import { readFile } from 'fs/promises';
  4   | import { fileURLToPath } from 'url';
  5   | 
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = dirname(__filename);
  8   | 
  9   | /**
  10  |  * E2E test for CLI-produced manifest → browser loader
  11  |  * 
  12  |  * Server managed by Playwright webServer config (playwright.config.manifest.ts)
  13  |  * Test fixtures generated before tests run (see package.json test:manifest script)
  14  |  */
  15  | 
  16  | const TEST_PASSWORD = 'TestFixturePassword123';
  17  | 
  18  | test.describe('CLI → Manifest → Browser Loader', () => {
  19  |   // Server lifecycle managed by Playwright webServer config
  20  | 
  21  |   test('manifest.json contains no plaintext content', async () => {
  22  |     const manifestPath = join(__dirname, '../dist/data/manifest.json');
  23  |     const manifestText = await readFile(manifestPath, 'utf-8');
  24  |     const manifest = JSON.parse(manifestText);
  25  | 
  26  |     // Verify structure
  27  |     expect(manifest.version).toBe('1.0.0');
  28  |     expect(manifest.entries).toBeInstanceOf(Array);
  29  |     expect(manifest.entries.length).toBeGreaterThan(0);
  30  | 
  31  |     // Check for plaintext leaks
  32  |     const sensitiveStrings = [
  33  |       '测试日记标题',
  34  |       '这是一篇测试',
  35  |       '今日学习记录',
  36  |       '第46周总结',
  37  |     ];
  38  | 
  39  |     for (const sensitive of sensitiveStrings) {
  40  |       expect(manifestText).not.toContain(sensitive);
  41  |     }
  42  | 
  43  |     // Verify entries have required fields but NO plaintext
  44  |     for (const entry of manifest.entries) {
  45  |       expect(entry).toHaveProperty('id');
  46  |       expect(entry).toHaveProperty('date');
  47  |       expect(entry).toHaveProperty('type');
  48  |       expect(entry).toHaveProperty('encryptedPath');
  49  |       expect(entry).not.toHaveProperty('title');
  50  |       expect(entry).not.toHaveProperty('content');
  51  |       expect(entry).not.toHaveProperty('tags');
  52  |     }
  53  |   });
  54  | 
  55  |   test('loads published diary entry from manifest', async ({ page, context }) => {
  56  |     // Clear all storage (NEW browser session)
  57  |     await context.clearCookies();
  58  |     await page.goto('/#/settings');
  59  |     
  60  |     await page.evaluate(async () => {
  61  |       const dbs = await indexedDB.databases();
  62  |       for (const db of dbs) {
  63  |         if (db.name) indexedDB.deleteDatabase(db.name);
  64  |       }
  65  |       localStorage.clear();
  66  |       sessionStorage.clear();
  67  |     });
  68  | 
  69  |     // Reload to ensure clean state
  70  |     await page.reload();
  71  | 
  72  |     // Initialize vault with TEST password (matches published vault verifier)
  73  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  74  |     await page.locator('#password').fill(TEST_PASSWORD);
  75  |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  76  |     await page.getByRole('button', { name: '确认初始化' }).click();
  77  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  78  | 
  79  |     // Navigate to diary list
  80  |     await page.click('a[href="#/diary"]');
  81  |     await page.waitForTimeout(500);
  82  | 
  83  |     // Should see published entry (with cloud badge)
  84  |     const publishedEntry = page.locator('a[href="#/diary/2026-11-16"]');
> 85  |     await expect(publishedEntry).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  86  | 
  87  |     // Click to view detail
  88  |     await publishedEntry.click();
  89  |     await page.waitForTimeout(500);
  90  | 
  91  |     // Should see decrypted content
  92  |     await expect(page.getByText('测试日记标题 🌟')).toBeVisible();
  93  |     await expect(page.getByText('这是一篇测试日记的内容')).toBeVisible();
  94  |     await expect(page.getByText('包含中文字符和Unicode表情')).toBeVisible();
  95  | 
  96  |     // Content successfully decrypted and displayed from published manifest ✅
  97  |   });
  98  | 
  99  |   test('deep link to published entry works on page reload', async ({ page, context }) => {
  100 |     // Clear storage
  101 |     await context.clearCookies();
  102 |     await page.goto('/#/settings');
  103 |     await page.evaluate(async () => {
  104 |       const dbs = await indexedDB.databases();
  105 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  106 |     });
  107 | 
  108 |     // Initialize vault
  109 |     await page.reload();
  110 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  111 |     await page.locator('#password').fill(TEST_PASSWORD);
  112 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  113 |     await page.getByRole('button', { name: '确认初始化' }).click();
  114 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  115 | 
  116 |     // Navigate directly to diary detail via deep link (hash routing)
  117 |     await page.goto('/#/diary/2026-11-16');
  118 |     await page.waitForTimeout(1000);
  119 |     
  120 |     // Should see content (vault still unlocked)
  121 |     await expect(page.getByText('测试日记标题 🌟')).toBeVisible();
  122 | 
  123 |     // Full page reload locks vault - verify by going to a page and seeing locked state
  124 |     await page.reload();
  125 |     await page.waitForTimeout(1000);
  126 | 
  127 |     // Deep link with hash routing preserved URL, but vault is locked
  128 |     await expect(page.getByText('请先解锁保险库')).toBeVisible();
  129 |   });
  130 | 
  131 |   test('rejects wrong password for published entries', async ({ page, context }) => {
  132 |     await context.clearCookies();
  133 |     await page.goto('/#/settings');
  134 |     await page.evaluate(async () => {
  135 |       const dbs = await indexedDB.databases();
  136 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  137 |     });
  138 | 
  139 |     // Initialize with WRONG password
  140 |     await page.reload();
  141 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  142 |     await page.locator('#password').fill('WrongPassword123!@#');
  143 |     await page.locator('#confirm-password').fill('WrongPassword123!@#');
  144 |     await page.getByRole('button', { name: '确认初始化' }).click();
  145 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  146 | 
  147 |     // Try to view published entry
  148 |     await page.click('a[href="#/diary"]');
  149 |     await page.waitForTimeout(500);
  150 | 
  151 |     // Entry may show in list (metadata is public) but decryption should fail
  152 |     const entry = page.locator('a[href="#/diary/2026-11-16"]');
  153 |     const entryExists = await entry.count();
  154 | 
  155 |     if (entryExists > 0) {
  156 |       await entry.click();
  157 |       await page.waitForTimeout(500);
  158 | 
  159 |       // Should show error or empty content (decryption failed)
  160 |       const hasError = await page.getByText('加载失败').count();
  161 |       const hasContent = await page.getByText('测试日记标题').count();
  162 |       
  163 |       // Either shows error OR entry not found
  164 |       expect(hasError > 0 || hasContent === 0).toBeTruthy();
  165 |     }
  166 |   });
  167 | 
  168 |   test('merges published and local drafts without overwrite', async ({ page, context }) => {
  169 |     // Clear storage
  170 |     await context.clearCookies();
  171 |     await page.goto('/#/settings');
  172 |     await page.evaluate(async () => {
  173 |       const dbs = await indexedDB.databases();
  174 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  175 |     });
  176 | 
  177 |     // Initialize vault
  178 |     await page.reload();
  179 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  180 |     await page.locator('#password').fill(TEST_PASSWORD);
  181 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  182 |     await page.getByRole('button', { name: '确认初始化' }).click();
  183 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  184 | 
  185 |     // Create local draft for DIFFERENT date
```