# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manifest.spec.ts >> CLI → Manifest → Browser Loader >> loads published diary entry from manifest
- Location: e2e/manifest.spec.ts:83:3

# Error details

```
Error: page.reload: net::ERR_CONNECTION_REFUSED
Call log:
  - waiting for navigation until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { spawn, type ChildProcess } from 'child_process';
  3   | import { join, dirname } from 'path';
  4   | import { readFile } from 'fs/promises';
  5   | import { fileURLToPath } from 'url';
  6   | 
  7   | const __filename = fileURLToPath(import.meta.url);
  8   | const __dirname = dirname(__filename);
  9   | 
  10  | /**
  11  |  * E2E test for CLI-produced manifest → browser loader
  12  |  * 
  13  |  * Tests:
  14  |  * - CLI encrypts entries and generates manifest
  15  |  * - Production build includes data/
  16  |  * - Simple static server (NOT vite preview with history fallback)
  17  |  * - NEW browser can unlock published vault without local vault
  18  |  * - Published entries load and decrypt correctly
  19  |  * - Deep links work on page reload
  20  |  * - Manifest security: path traversal rejection, wrong password safe handling
  21  |  * - No plaintext titles/content in manifest
  22  |  */
  23  | 
  24  | const TEST_PASSWORD = 'TestPassword123!@#Strong';
  25  | let staticServer: ChildProcess | null = null;
  26  | const STATIC_PORT = 8174;
  27  | 
  28  | test.describe('CLI → Manifest → Browser Loader', () => {
  29  |   test.beforeAll(async () => {
  30  |     // Start simple static server with SPA fallback (NOT vite preview)
  31  |     staticServer = spawn('node', ['test-server.js'], {
  32  |       cwd: join(__dirname, '..'),
  33  |       env: { ...process.env, PORT: String(STATIC_PORT) },
  34  |       stdio: 'inherit',
  35  |     });
  36  | 
  37  |     // Wait for server to start
  38  |     await new Promise(resolve => setTimeout(resolve, 2000));
  39  |     
  40  |     console.log(`Static server started on port ${STATIC_PORT}`);
  41  |   });
  42  | 
  43  |   test.afterAll(async () => {
  44  |     if (staticServer) {
  45  |       staticServer.kill();
  46  |     }
  47  |   });
  48  | 
  49  |   test('manifest.json contains no plaintext content', async () => {
  50  |     const manifestPath = join(__dirname, '../dist/data/manifest.json');
  51  |     const manifestText = await readFile(manifestPath, 'utf-8');
  52  |     const manifest = JSON.parse(manifestText);
  53  | 
  54  |     // Verify structure
  55  |     expect(manifest.version).toBe('1.0.0');
  56  |     expect(manifest.entries).toBeInstanceOf(Array);
  57  |     expect(manifest.entries.length).toBeGreaterThan(0);
  58  | 
  59  |     // Check for plaintext leaks
  60  |     const sensitiveStrings = [
  61  |       '测试日记标题',
  62  |       '这是一篇测试',
  63  |       '今日学习记录',
  64  |       '第46周总结',
  65  |     ];
  66  | 
  67  |     for (const sensitive of sensitiveStrings) {
  68  |       expect(manifestText).not.toContain(sensitive);
  69  |     }
  70  | 
  71  |     // Verify entries have required fields but NO plaintext
  72  |     for (const entry of manifest.entries) {
  73  |       expect(entry).toHaveProperty('id');
  74  |       expect(entry).toHaveProperty('date');
  75  |       expect(entry).toHaveProperty('type');
  76  |       expect(entry).toHaveProperty('encryptedPath');
  77  |       expect(entry).not.toHaveProperty('title');
  78  |       expect(entry).not.toHaveProperty('content');
  79  |       expect(entry).not.toHaveProperty('tags');
  80  |     }
  81  |   });
  82  | 
  83  |   test('loads published diary entry from manifest', async ({ page, context }) => {
  84  |     // Clear all storage (NEW browser session)
  85  |     await context.clearCookies();
  86  |     await page.goto(`http://localhost:${STATIC_PORT}/settings`);
  87  |     
  88  |     await page.evaluate(async () => {
  89  |       const dbs = await indexedDB.databases();
  90  |       for (const db of dbs) {
  91  |         if (db.name) indexedDB.deleteDatabase(db.name);
  92  |       }
  93  |       localStorage.clear();
  94  |       sessionStorage.clear();
  95  |     });
  96  | 
  97  |     // Reload to ensure clean state
> 98  |     await page.reload();
      |                ^ Error: page.reload: net::ERR_CONNECTION_REFUSED
  99  | 
  100 |     // Initialize vault with TEST password (matches published vault verifier)
  101 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  102 |     await page.locator('#password').fill(TEST_PASSWORD);
  103 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  104 |     await page.getByRole('button', { name: '确认初始化' }).click();
  105 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  106 | 
  107 |     // Navigate to diary list
  108 |     await page.click('a[href="/diary"]');
  109 |     await page.waitForTimeout(500);
  110 | 
  111 |     // Should see published entry (with cloud badge)
  112 |     const publishedEntry = page.locator('a[href="/diary/2026-11-16"]');
  113 |     await expect(publishedEntry).toBeVisible();
  114 | 
  115 |     // Click to view detail
  116 |     await publishedEntry.click();
  117 |     await page.waitForTimeout(500);
  118 | 
  119 |     // Should see decrypted content
  120 |     await expect(page.getByText('测试日记标题 🌟')).toBeVisible();
  121 |     await expect(page.getByText('这是一篇测试日记的内容')).toBeVisible();
  122 |     await expect(page.getByText('包含中文字符和Unicode表情')).toBeVisible();
  123 | 
  124 |     // Verify published indicator
  125 |     const cloudIcon = page.locator('svg').filter({ has: page.locator('title:has-text("已发布")') });
  126 |     expect(await cloudIcon.count()).toBeGreaterThan(0);
  127 | 
  128 |     // Verify edit/delete buttons are hidden (read-only)
  129 |     const editButton = page.getByRole('button', { name: '编辑' });
  130 |     const deleteButton = page.getByRole('button', { name: '删除' });
  131 |     expect(await editButton.count()).toBe(0);
  132 |     expect(await deleteButton.count()).toBe(0);
  133 |   });
  134 | 
  135 |   test('deep link to published entry works on page reload', async ({ page, context }) => {
  136 |     // Clear storage
  137 |     await context.clearCookies();
  138 |     await page.goto(`http://localhost:${STATIC_PORT}/settings`);
  139 |     await page.evaluate(async () => {
  140 |       const dbs = await indexedDB.databases();
  141 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  142 |     });
  143 | 
  144 |     // Initialize vault
  145 |     await page.reload();
  146 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  147 |     await page.locator('#password').fill(TEST_PASSWORD);
  148 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  149 |     await page.getByRole('button', { name: '确认初始化' }).click();
  150 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  151 | 
  152 |     // Navigate directly to diary detail via deep link
  153 |     await page.goto(`http://localhost:${STATIC_PORT}/diary/2026-11-16`);
  154 |     await page.waitForTimeout(500);
  155 | 
  156 |     // Full page reload should lock vault
  157 |     await page.reload();
  158 |     await page.waitForTimeout(500);
  159 | 
  160 |     // Should show locked message
  161 |     await expect(page.getByText('请先解锁保险库')).toBeVisible();
  162 | 
  163 |     // Unlock
  164 |     await page.getByRole('button', { name: '解锁' }).first().click();
  165 |     await page.locator('#unlock-password').fill(TEST_PASSWORD);
  166 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  167 |     await page.waitForTimeout(500);
  168 | 
  169 |     // Navigate to diary detail again via client-side navigation
  170 |     await page.click('a[href="/diary"]');
  171 |     await page.waitForTimeout(300);
  172 |     await page.click('a[href="/diary/2026-11-16"]');
  173 |     await page.waitForTimeout(300);
  174 | 
  175 |     // Should now show content
  176 |     await expect(page.getByText('测试日记标题 🌟')).toBeVisible();
  177 |   });
  178 | 
  179 |   test('rejects wrong password for published entries', async ({ page, context }) => {
  180 |     await context.clearCookies();
  181 |     await page.goto(`http://localhost:${STATIC_PORT}/settings`);
  182 |     await page.evaluate(async () => {
  183 |       const dbs = await indexedDB.databases();
  184 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  185 |     });
  186 | 
  187 |     // Initialize with WRONG password
  188 |     await page.reload();
  189 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  190 |     await page.locator('#password').fill('WrongPassword123!@#');
  191 |     await page.locator('#confirm-password').fill('WrongPassword123!@#');
  192 |     await page.getByRole('button', { name: '确认初始化' }).click();
  193 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  194 | 
  195 |     // Try to view published entry
  196 |     await page.click('a[href="/diary"]');
  197 |     await page.waitForTimeout(500);
  198 | 
```