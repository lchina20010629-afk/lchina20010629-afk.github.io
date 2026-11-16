import { test, expect } from '@playwright/test';

/**
 * E2E tests for vault initialization and unlock/lock functionality
 * Tests run against the dev server at http://localhost:5173
 */

test.describe('Vault Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:5173/settings');
    
    // Clear IndexedDB
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Reload to reset state
    await page.reload();
  });

  test('initializes vault with strong password', async ({ page }) => {
    await expect(page.getByText('保险库未初始化')).toBeVisible();
    
    await page.getByRole('button', { name: '初始化保险库' }).click();
    
    const password = 'TestPassword123!@#Strong';
    await page.locator('#password').fill(password);
    await page.locator('#confirm-password').fill(password);
    
    await page.getByRole('button', { name: '确认初始化' }).click();
    
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  });

  test('rejects weak password during initialization', async ({ page }) => {
    await page.getByRole('button', { name: '初始化保险库' }).click();
    
    const weakPassword = '12345';
    await page.locator('#password').fill(weakPassword);
    await page.locator('#confirm-password').fill(weakPassword);
    
    await page.getByRole('button', { name: '确认初始化' }).click();
    
    await expect(page.getByText(/密码强度不足/)).toBeVisible();
  });

  test('locks and unlocks vault with correct password', async ({ page }) => {
    // Initialize first
    await page.getByRole('button', { name: '初始化保险库' }).click();
    const password = 'TestPassword123!@#Strong';
    await page.locator('#password').fill(password);
    await page.locator('#confirm-password').fill(password);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Lock it
    await page.getByRole('button', { name: '锁定' }).click();
    await expect(page.getByText('保险库已锁定')).toBeVisible();

    // Unlock with correct password - first open the form
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.locator('#unlock-password').fill(password);
    // Then submit the form
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible();
  });

  test('rejects wrong password during unlock', async ({ page }) => {
    // Initialize
    await page.getByRole('button', { name: '初始化保险库' }).click();
    const password = 'TestPassword123!@#Strong';
    await page.locator('#password').fill(password);
    await page.locator('#confirm-password').fill(password);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Lock
    await page.getByRole('button', { name: '锁定' }).click();

    // Try wrong password - first open form
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.locator('#unlock-password').fill('WrongPassword123!');
    // Submit form
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('密码错误')).toBeVisible();
  });
});
