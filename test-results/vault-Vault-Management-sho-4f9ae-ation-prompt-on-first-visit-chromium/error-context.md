# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vault.spec.ts >> Vault Management >> should display vault initialization prompt on first visit
- Location: e2e/vault.spec.ts:26:3

# Error details

```
Error: page.evaluate: Target page, context or browser has been closed
```

```
Error: write EPIPE
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * E2E Test: Vault Initialization, Lock/Unlock, State Management
  5   |  * 
  6   |  * Tests gate #1: Empty site initialize vault, lock/unlock/reload,
  7   |  * verify IndexedDB encryption, wrong password handling
  8   |  */
  9   | 
  10  | test.describe('Vault Management', () => {
  11  |   test.beforeEach(async ({ page, context }) => {
  12  |     // Clear storage before each test
  13  |     await context.clearCookies();
  14  |     await page.goto('/');
  15  |     
  16  |     // Clear IndexedDB
> 17  |     await page.evaluate(() => {
      |     ^ Error: write EPIPE
  18  |       return new Promise<void>((resolve) => {
  19  |         const request = indexedDB.deleteDatabase('life-growth-db');
  20  |         request.onsuccess = () => resolve();
  21  |         request.onerror = () => resolve();
  22  |       });
  23  |     });
  24  |   });
  25  | 
  26  |   test('should display vault initialization prompt on first visit', async ({ page }) => {
  27  |     await page.goto('/settings');
  28  |     
  29  |     // Should show vault uninitialized message
  30  |     await expect(page.locator('text=保险库未初始化')).toBeVisible();
  31  |     await expect(page.locator('button:has-text("初始化保险库")')).toBeVisible();
  32  |   });
  33  | 
  34  |   test('should initialize vault with strong password', async ({ page }) => {
  35  |     await page.goto('/settings');
  36  |     
  37  |     // Click initialize button
  38  |     await page.click('button:has-text("初始化保险库")');
  39  |     
  40  |     // Fill password form
  41  |     const strongPassword = 'TestP@ssw0rd!2024Long';
  42  |     await page.fill('input[type="password"]#password', strongPassword);
  43  |     await page.fill('input[type="password"]#confirm-password', strongPassword);
  44  |     
  45  |     // Submit
  46  |     await page.click('button[type="submit"]:has-text("确认初始化")');
  47  |     
  48  |     // Should show success
  49  |     await expect(page.locator('text=保险库已初始化')).toBeVisible({ timeout: 5000 });
  50  |     
  51  |     // Verify IndexedDB was created
  52  |     const dbExists = await page.evaluate(async () => {
  53  |       const dbs = await indexedDB.databases();
  54  |       return dbs.some(db => db.name === 'life-growth-db');
  55  |     });
  56  |     expect(dbExists).toBe(true);
  57  |   });
  58  | 
  59  |   test('should reject weak password', async ({ page }) => {
  60  |     await page.goto('/settings');
  61  |     await page.click('button:has-text("初始化保险库")');
  62  |     
  63  |     // Try weak password
  64  |     await page.fill('input[type="password"]#password', '123456');
  65  |     await page.fill('input[type="password"]#confirm-password', '123456');
  66  |     
  67  |     // Should show strength warning
  68  |     await expect(page.locator('text=密码强度不足')).toBeVisible({ timeout: 2000 });
  69  |   });
  70  | 
  71  |   test('should reject mismatched passwords', async ({ page }) => {
  72  |     await page.goto('/settings');
  73  |     await page.click('button:has-text("初始化保险库")');
  74  |     
  75  |     await page.fill('input[type="password"]#password', 'TestP@ssw0rd!2024');
  76  |     await page.fill('input[type="password"]#confirm-password', 'DifferentP@ssw0rd');
  77  |     await page.click('button[type="submit"]:has-text("确认初始化")');
  78  |     
  79  |     await expect(page.locator('text=两次输入的密码不一致')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('should persist vault initialization across reload', async ({ page }) => {
  83  |     // Initialize vault
  84  |     await page.goto('/settings');
  85  |     await page.click('button:has-text("初始化保险库")');
  86  |     
  87  |     const password = 'TestP@ssw0rd!2024Long';
  88  |     await page.fill('input[type="password"]#password', password);
  89  |     await page.fill('input[type="password"]#confirm-password', password);
  90  |     await page.click('button[type="submit"]:has-text("确认初始化")');
  91  |     
  92  |     await expect(page.locator('text=保险库已初始化')).toBeVisible();
  93  |     
  94  |     // Reload page
  95  |     await page.reload();
  96  |     
  97  |     // Should still show as initialized
  98  |     await expect(page.locator('text=保险库已初始化')).toBeVisible();
  99  |   });
  100 | });
  101 | 
  102 | test.describe('Accessibility', () => {
  103 |   test('should support keyboard navigation', async ({ page }) => {
  104 |     await page.goto('/');
  105 |     
  106 |     // Tab through navigation
  107 |     await page.keyboard.press('Tab');
  108 |     await page.keyboard.press('Tab');
  109 |     
  110 |     // Should have visible focus indicator
  111 |     const focused = await page.evaluate(() => {
  112 |       const active = document.activeElement;
  113 |       const styles = window.getComputedStyle(active!);
  114 |       return styles.outline !== 'none';
  115 |     });
  116 |     
  117 |     // Some element should be focused
```