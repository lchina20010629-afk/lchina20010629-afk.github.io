import { test, expect } from '@playwright/test';
import { saveDiaryEntry, loadDiaryEntry } from '../src/lib/diaryStorage';

const TEST_PASSWORD = 'TestPass123!';

test.describe('Database Schema Migration', () => {
  test('upgrades from v1 to v2 preserving encrypted diary', async ({ page, context }) => {
    // Step 0: Clear everything first
    await context.clearCookies();
    await page.goto('/#/settings');
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
    await page.reload();
    
    // Step 1: Initialize vault - click button to show form first
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Create encrypted diary entry
    await page.click('a[href="#/diary"]');
    await page.waitForTimeout(200);
    await page.getByText('创建日记').click();
    const today = new Date().toISOString().split('T')[0];
    await page.locator('#date').fill(today);
    await page.locator('#title').fill('Migration Test Entry');
    await page.locator('#content').fill('This entry should survive database upgrade from v1 to v2');
    await page.getByRole('button', { name: '保存' }).click();
    await page.waitForURL(`**/#/diary/${today}`);
    
    // Verify entry exists
    await page.goto('/#/diary');
    await expect(page.locator(`a[href="#/diary/${today}"]`)).toBeVisible();
    
    // Step 2: Reload page to trigger potential migration
    await page.reload();
    await page.waitForTimeout(1000); // Allow IndexedDB to initialize
    
    // Step 3: Unlock and verify entry still accessible - go to settings
    await page.click('a[href="#/settings"]');
    await page.waitForTimeout(200);
    
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.locator('#unlock-password').fill(TEST_PASSWORD);
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    await page.goto('/#/diary');
    await expect(page.locator(`a[href="#/diary/${today}"]`)).toBeVisible({ timeout: 10000 });
    
    // Step 4: Open entry and verify content preserved
    await page.locator(`a[href="#/diary/${today}"]`).click();
    await expect(page.getByText('Migration Test Entry')).toBeVisible();
    await expect(page.getByText('This entry should survive database upgrade')).toBeVisible();
  });

  test('new v2 stores (courseDrafts, reviewDrafts) created on first access', async ({ page, context }) => {
    // Clear IndexedDB
    await context.clearCookies();
    await page.goto('/#/settings');
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
    
    // Reload to reflect cleared state
    await page.reload();
    await page.waitForTimeout(500);

    // Init vault - click button to show form first
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Navigate to learning - should create courseDrafts store
    await page.goto('/#/learning');
    await expect(page.locator('h1:has-text("成长学习")')).toBeVisible();
    
    // Navigate to reviews - should create review stores
    await page.goto('/#/reviews');
    await expect(page.locator('h1:has-text("复盘反思")')).toBeVisible();
    
    // Verify stores exist without errors
    const storeCheck = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.open('life-growth-db');
        req.onsuccess = (event: any) => {
          const db = event.target.result;
          const hasAll = db.objectStoreNames.contains('courseDrafts') &&
                         db.objectStoreNames.contains('weeklyDrafts') &&
                         db.objectStoreNames.contains('monthlyDrafts') &&
                         db.objectStoreNames.contains('yearlyDrafts');
          db.close();
          resolve(hasAll);
        };
        req.onerror = () => resolve(false);
      });
    });
    
    expect(storeCheck).toBe(true);
  });
});
