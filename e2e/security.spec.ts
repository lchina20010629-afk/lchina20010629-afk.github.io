import { test, expect } from '@playwright/test';

/**
 * Security tests: Verify no sensitive data persists in storage
 */

test.describe('Security: No Secret Persistence', () => {
  const testPassword = 'TestPassword123!@#Strong';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:5173/settings');
    
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload();
  });

  test('no plaintext password in storage after initialize', async ({ page }) => {
    // Initialize vault
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Check storage
    const storage = await page.evaluate(() => ({
      localStorage: JSON.stringify(localStorage),
      sessionStorage: JSON.stringify(sessionStorage),
    }));

    // Password should NOT be in storage
    expect(storage.localStorage).not.toContain(testPassword);
    expect(storage.sessionStorage).not.toContain(testPassword);
    expect(storage.localStorage).not.toContain('password');
    expect(storage.sessionStorage).not.toContain('password');
  });

  test('no plaintext password in storage after unlock', async ({ page }) => {
    // Initialize
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Lock
    await page.getByRole('button', { name: '锁定' }).click();

    // Unlock
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.locator('#unlock-password').fill(testPassword);
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible();

    // Check storage again
    const storage = await page.evaluate(() => ({
      localStorage: JSON.stringify(localStorage),
      sessionStorage: JSON.stringify(sessionStorage),
    }));

    expect(storage.localStorage).not.toContain(testPassword);
    expect(storage.sessionStorage).not.toContain(testPassword);
  });

  test('full page reload requires re-unlock', async ({ page }) => {
    // Initialize
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Full page reload
    await page.reload();

    // Should be locked after reload
    await page.goto('http://localhost:5173/settings');
    await expect(page.getByText('保险库已锁定')).toBeVisible();
  });

  test('locked state shows no decrypted content', async ({ page }) => {
    // Initialize and create entry
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Create diary with private content
    await page.click('a[href="/diary"]');
    await page.waitForTimeout(200);
    await page.getByText('创建日记').click();
    await page.waitForSelector('#date');
    
    const secretContent = 'PRIVATE_SECRET_DATA_12345';
    await page.locator('#date').fill(new Date().toISOString().split('T')[0]);
    await page.locator('#title').fill('Secret Entry');
    await page.locator('#content').fill(secretContent);
    await page.getByRole('button', { name: '保存' }).click();
    await page.waitForTimeout(1000);

    // Lock vault
    await page.click('a[href="/settings"]');
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: '锁定' }).click();

    // Navigate to diary - should not show secret content
    await page.click('a[href="/diary"]');
    await page.waitForTimeout(200);
    
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain(secretContent);
    expect(bodyText).toContain('请先解锁保险库');
  });

  test('no password-derived keys in IndexedDB', async ({ page }) => {
    // Initialize
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Check IndexedDB contents
    const dbData = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('life-growth-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const allKeys = await new Promise<string[]>((resolve) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result as string[]);
      });

      const data: Record<string, unknown> = {};
      for (const key of allKeys) {
        const value = await new Promise((resolve) => {
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result);
        });
        data[key] = value;
      }

      return JSON.stringify(data);
    });

    // Password should NOT be in IndexedDB
    expect(dbData).not.toContain(testPassword);
    // Only verifier should exist (contains salt and verifier, no password)
    expect(dbData).toContain('password_verifier');
  });
});
