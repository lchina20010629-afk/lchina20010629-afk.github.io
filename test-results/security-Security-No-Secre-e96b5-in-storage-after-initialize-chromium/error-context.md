# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security: No Secret Persistence >> no plaintext password in storage after initialize
- Location: e2e/security.spec.ts:26:3

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('button', { name: '初始化保险库' })

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Security tests: Verify no sensitive data persists in storage
  5   |  */
  6   | 
  7   | test.describe('Security: No Secret Persistence', () => {
  8   |   const testPassword = 'TestPassword123!@#Strong';
  9   | 
  10  |   test.beforeEach(async ({ page, context }) => {
  11  |     await context.clearCookies();
  12  |     await page.goto('http://localhost:5173/settings');
  13  |     
  14  |     await page.evaluate(async () => {
  15  |       const dbs = await indexedDB.databases();
  16  |       for (const db of dbs) {
  17  |         if (db.name) indexedDB.deleteDatabase(db.name);
  18  |       }
  19  |       localStorage.clear();
  20  |       sessionStorage.clear();
  21  |     });
  22  |     
  23  |     await page.reload();
  24  |   });
  25  | 
  26  |   test('no plaintext password in storage after initialize', async ({ page }) => {
  27  |     // Initialize vault
> 28  |     await page.getByRole('button', { name: '初始化保险库' }).click();
      |                                                        ^ Error: locator.click: Target page, context or browser has been closed
  29  |     await page.locator('#password').fill(testPassword);
  30  |     await page.locator('#confirm-password').fill(testPassword);
  31  |     await page.getByRole('button', { name: '确认初始化' }).click();
  32  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  33  | 
  34  |     // Check storage
  35  |     const storage = await page.evaluate(() => ({
  36  |       localStorage: JSON.stringify(localStorage),
  37  |       sessionStorage: JSON.stringify(sessionStorage),
  38  |     }));
  39  | 
  40  |     // Password should NOT be in storage
  41  |     expect(storage.localStorage).not.toContain(testPassword);
  42  |     expect(storage.sessionStorage).not.toContain(testPassword);
  43  |     expect(storage.localStorage).not.toContain('password');
  44  |     expect(storage.sessionStorage).not.toContain('password');
  45  |   });
  46  | 
  47  |   test('no plaintext password in storage after unlock', async ({ page }) => {
  48  |     // Initialize
  49  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  50  |     await page.locator('#password').fill(testPassword);
  51  |     await page.locator('#confirm-password').fill(testPassword);
  52  |     await page.getByRole('button', { name: '确认初始化' }).click();
  53  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  54  | 
  55  |     // Lock
  56  |     await page.getByRole('button', { name: '锁定' }).click();
  57  | 
  58  |     // Unlock
  59  |     await page.getByRole('button', { name: '解锁' }).first().click();
  60  |     await page.locator('#unlock-password').fill(testPassword);
  61  |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  62  |     await expect(page.getByText('保险库已解锁')).toBeVisible();
  63  | 
  64  |     // Check storage again
  65  |     const storage = await page.evaluate(() => ({
  66  |       localStorage: JSON.stringify(localStorage),
  67  |       sessionStorage: JSON.stringify(sessionStorage),
  68  |     }));
  69  | 
  70  |     expect(storage.localStorage).not.toContain(testPassword);
  71  |     expect(storage.sessionStorage).not.toContain(testPassword);
  72  |   });
  73  | 
  74  |   test('full page reload requires re-unlock', async ({ page }) => {
  75  |     // Initialize
  76  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  77  |     await page.locator('#password').fill(testPassword);
  78  |     await page.locator('#confirm-password').fill(testPassword);
  79  |     await page.getByRole('button', { name: '确认初始化' }).click();
  80  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  81  | 
  82  |     // Full page reload
  83  |     await page.reload();
  84  | 
  85  |     // Should be locked after reload
  86  |     await page.goto('http://localhost:5173/settings');
  87  |     await expect(page.getByText('保险库已锁定')).toBeVisible();
  88  |   });
  89  | 
  90  |   test('locked state shows no decrypted content', async ({ page }) => {
  91  |     // Initialize and create entry
  92  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  93  |     await page.locator('#password').fill(testPassword);
  94  |     await page.locator('#confirm-password').fill(testPassword);
  95  |     await page.getByRole('button', { name: '确认初始化' }).click();
  96  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  97  | 
  98  |     // Create diary with private content
  99  |     await page.click('a[href="/diary"]');
  100 |     await page.waitForTimeout(200);
  101 |     await page.getByText('创建日记').click();
  102 |     await page.waitForSelector('#date');
  103 |     
  104 |     const secretContent = 'PRIVATE_SECRET_DATA_12345';
  105 |     await page.locator('#date').fill(new Date().toISOString().split('T')[0]);
  106 |     await page.locator('#title').fill('Secret Entry');
  107 |     await page.locator('#content').fill(secretContent);
  108 |     await page.getByRole('button', { name: '保存' }).click();
  109 |     await page.waitForTimeout(1000);
  110 | 
  111 |     // Lock vault
  112 |     await page.click('a[href="/settings"]');
  113 |     await page.waitForTimeout(200);
  114 |     await page.getByRole('button', { name: '锁定' }).click();
  115 | 
  116 |     // Navigate to diary - should not show secret content
  117 |     await page.click('a[href="/diary"]');
  118 |     await page.waitForTimeout(200);
  119 |     
  120 |     const bodyText = await page.textContent('body');
  121 |     expect(bodyText).not.toContain(secretContent);
  122 |     expect(bodyText).toContain('请先解锁保险库');
  123 |   });
  124 | 
  125 |   test('no password-derived keys in IndexedDB', async ({ page }) => {
  126 |     // Initialize
  127 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  128 |     await page.locator('#password').fill(testPassword);
```