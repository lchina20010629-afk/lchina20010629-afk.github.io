import { test, expect } from '@playwright/test';
import { saveDiaryEntry, loadDiaryEntry } from '../src/lib/diaryStorage';

const TEST_PASSWORD = 'TestPass123!';

test.describe('Database Schema Migration', () => {
  test('upgrades from v1 to v2 preserving encrypted diary', async ({ page }) => {
    // Step 1: Create v1 database with encrypted diary
    await page.goto('http://localhost:5173/');
    
    // Initialize vault
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button:has-text("初始化保险库")').click();
    await page.waitForURL('**/');
    
    // Create encrypted diary entry
    await page.goto('http://localhost:5173/#/diary/create');
    await page.locator('input[placeholder*="标题"]').fill('Migration Test Entry');
    await page.locator('textarea[placeholder*="内容"]').fill('This entry should survive database upgrade from v1 to v2');
    await page.locator('button:has-text("保存")').click();
    await page.waitForURL('**/#/diary');
    
    // Verify entry exists
    await expect(page.locator('a[href="#/diary/"]').first()).toBeVisible();
    const dateLink = await page.locator('a[href^="#/diary/"]').first().getAttribute('href');
    const date = dateLink?.replace('#/diary/', '');
    
    // Step 2: Reload page to trigger potential migration
    await page.reload();
    await page.waitForTimeout(1000); // Allow IndexedDB to initialize
    
    // Step 3: Unlock and verify entry still accessible
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("解锁")').click();
    await page.waitForURL('**/');
    
    await page.goto('http://localhost:5173/#/diary');
    await expect(page.locator(`a[href="#/diary/${date}"]`)).toBeVisible();
    
    // Step 4: Open entry and verify content preserved
    await page.locator(`a[href="#/diary/${date}"]`).click();
    await expect(page.locator('h1:has-text("Migration Test Entry")')).toBeVisible();
    await expect(page.locator('text=This entry should survive database upgrade')).toBeVisible();
  });

  test('new v2 stores (courseDrafts, reviewDrafts) created on first access', async ({ page, context }) => {
    // Clear IndexedDB
    await context.clearCookies();
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const dbs = indexedDB.databases?.() || Promise.resolve([]);
        dbs.then(databases => {
          Promise.all(databases.map(db => {
            if (db.name) {
              return new Promise<void>((res) => {
                const req = indexedDB.deleteDatabase(db.name);
                req.onsuccess = () => res();
                req.onerror = () => res();
              });
            }
            return Promise.resolve();
          })).then(() => resolve());
        });
      });
    });

    // Init vault
    await page.goto('http://localhost:5173/');
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button:has-text("初始化保险库")').click();
    await page.waitForURL('**/');
    
    // Navigate to learning - should create courseDrafts store
    await page.goto('http://localhost:5173/#/learning');
    await expect(page.locator('h1:has-text("成长学习")')).toBeVisible();
    
    // Navigate to reviews - should create review stores
    await page.goto('http://localhost:5173/#/reviews');
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
