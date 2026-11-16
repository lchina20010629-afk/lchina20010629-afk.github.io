import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

const TEST_PASSWORD = 'TestPass123!';
const FIXTURES_DIR = '/tmp/test-course-fixtures';

test.describe('Review Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear IndexedDB before each test
    await context.clearCookies();
    await page.goto('http://localhost:8175/');
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

    // Copy fixtures to dist/data
    await fs.cp(join(FIXTURES_DIR, 'manifest.json'), join(process.cwd(), 'dist/data/manifest.json'), { recursive: true });
    await fs.cp(join(FIXTURES_DIR, 'encrypted'), join(process.cwd(), 'dist/data/encrypted'), { recursive: true });
    
    // Init vault and unlock
    await page.goto('http://localhost:8175/');
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button:has-text("初始化保险库")').click();
    await page.waitForURL('**/'); // Back to dashboard
  });

  test.afterEach(async () => {
    // Clean up dist/data
    await fs.rm(join(process.cwd(), 'dist/data'), { recursive: true, force: true });
    await fs.mkdir(join(process.cwd(), 'dist/data'));
  });

  test('should load and display published reviews', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews');
    
    // Should see all 3 review types
    await expect(page.locator('text=2024-W11')).toBeVisible(); // weekly
    await expect(page.locator('text=2024-03')).toBeVisible(); // monthly
    await expect(page.locator('text=2024')).toBeVisible(); // yearly
    
    // Should see type labels
    await expect(page.locator('text=周总结').first()).toBeVisible();
    await expect(page.locator('text=月总结').first()).toBeVisible();
    await expect(page.locator('text=年终总结').first()).toBeVisible();
  });

  test('should render weekly review detail', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews/weekly/2024-W11');
    
    await expect(page.locator('text=第11周总结')).toBeVisible();
    await expect(page.locator('text=本周完成了两天的学习任务')).toBeVisible();
    await expect(page.locator('text=此记录已发布，为只读状态')).toBeVisible();
    
    // Should be read-only
    await expect(page.locator('input#title')).toBeDisabled();
    await expect(page.locator('textarea#content')).toBeDisabled();
  });

  test('should render monthly review detail', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews/monthly/2024-03');
    
    await expect(page.locator('text=三月总结')).toBeVisible();
    await expect(page.locator('text=三月份建立了四列学习法的框架')).toBeVisible();
  });

  test('should render yearly review detail', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews/yearly/2024');
    
    await expect(page.locator('text=2024年度总结')).toBeVisible();
    await expect(page.locator('text=2024年是个人成长系统化的一年')).toBeVisible();
    await expect(page.locator('text=建立个人成长系统')).toBeVisible();
  });

  test('should allow editing draft review', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews/weekly/2099-W99');
    
    // Should create new draft
    const titleInput = page.locator('input#title');
    await expect(titleInput).not.toBeDisabled();
    
    await titleInput.fill('Test Week Review');
    await page.locator('textarea#content').fill('This is a test review');
    await page.locator('button:has-text("保存")').click();
    
    // Reload - should persist
    await page.reload();
    await expect(page.locator('input#title')).toHaveValue('Test Week Review');
    await expect(page.locator('textarea#content')).toHaveValue('This is a test review');
  });

  test('should clear reviews on lock', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews/weekly/2024-W11');
    await expect(page.locator('text=第11周总结')).toBeVisible();
    
    // Lock
    await page.goto('http://localhost:8175/#/settings');
    await page.locator('button:has-text("锁定")').click();
    
    // Navigate back - should show locked message
    await page.goto('http://localhost:8175/#/reviews');
    await expect(page.locator('text=请先解锁保险库')).toBeVisible();
  });

  test('should use exact period keys', async ({ page }) => {
    await page.goto('http://localhost:8175/#/reviews');
    
    // Check quick create buttons use current period format
    const quickButtons = page.locator('.action-buttons a');
    await expect(quickButtons.nth(0)).toContainText('W'); // weekly: YYYY-Www
    await expect(quickButtons.nth(1)).toContainText('-'); // monthly: YYYY-MM
    await expect(quickButtons.nth(2)).toHaveAttribute('href', /#\/reviews\/yearly\/\d{4}$/); // yearly: YYYY
  });
});
