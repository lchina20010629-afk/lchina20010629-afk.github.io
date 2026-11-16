import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

const TEST_PASSWORD = 'TestPass123!';
const FIXTURES_DIR = '/tmp/test-course-fixtures';

test.describe('Course/Learning Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear IndexedDB before each test
    await context.clearCookies();
    await page.goto('/');
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
    await page.goto('/');
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

  test('should load and display published courses', async ({ page }) => {
    await page.goto('/#/learning');
    
    // Should see course entries
    await expect(page.locator('text=2024-03-15')).toBeVisible();
    await expect(page.locator('text=2024-03-16')).toBeVisible();
    
    // Both should show published badge
    await expect(page.locator('.published-badge').first()).toBeVisible();
  });

  test('should render course detail with 4 columns', async ({ page }) => {
    await page.goto('/#/learning/2024-03-16');
    
    // Check all 4 column headers
    await expect(page.locator('text=英语')).toBeVisible();
    await expect(page.locator('text=泰语')).toBeVisible();
    await expect(page.locator('text=修身养性')).toBeVisible();
    await expect(page.locator('text=生财有道')).toBeVisible();
    
    // Check materials
    await expect(page.locator('text=TED Talk: The power of words')).toBeVisible();
    await expect(page.locator('text=Thai script practice')).toBeVisible();
    await expect(page.locator('text=道德经 第一章')).toBeVisible();
    await expect(page.locator('text=Tesla vertical integration case')).toBeVisible();
    
    // Check reflections
    await expect(page.locator('text=Learned new idioms')).toBeVisible();
    await expect(page.locator('text=Supply chain strategy insights')).toBeVisible();
    
    // Check summary stats
    await expect(page.locator('text=30分钟')).toBeVisible(); // total minutes
    await expect(page.locator('text=100%')).toBeVisible(); // completion rate
  });

  test('should track explicit completion toggles locally', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/#/learning/${today}`);
    
    // All courses start uncompleted
    const firstToggle = page.locator('.completion-toggle').first();
    await expect(firstToggle.locator('text=未完成')).toBeVisible();
    
    // Toggle completion
    await firstToggle.click();
    await expect(firstToggle.locator('text=已完成')).toBeVisible();
    
    // Reload page - should persist
    await page.reload();
    await expect(firstToggle.locator('text=已完成')).toBeVisible();
  });

  test('should store and display reflection locally', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/#/learning/${today}`);
    
    // Enter reflection in first column
    const textarea = page.locator('textarea').first();
    await textarea.fill('Great progress on grammar today!');
    await page.waitForTimeout(500); // Wait for save
    
    // Reload - should persist
    await page.reload();
    await expect(page.locator('textarea').first()).toHaveValue('Great progress on grammar today!');
  });

  test('should clear course data on lock', async ({ page }) => {
    await page.goto('/#/learning/2024-03-16');
    await expect(page.locator('text=TED Talk')).toBeVisible();
    
    // Lock
    await page.goto('/#/settings');
    await page.locator('button:has-text("锁定")').click();
    
    // Navigate back - should show locked message
    await page.goto('/#/learning/2024-03-16');
    await expect(page.locator('text=请先解锁保险库')).toBeVisible();
    await expect(page.locator('text=TED Talk')).not.toBeVisible();
  });

  test('should not allow editing published courses', async ({ page }) => {
    await page.goto('/#/learning/2024-03-16');
    
    // Completion toggle should be disabled
    const toggle = page.locator('.completion-toggle').first();
    await expect(toggle).toBeDisabled();
    
    // Reflection fields should not exist (published uses <p> not <textarea>)
    await expect(page.locator('textarea')).not.toBeVisible();
  });

  test('should reject wrong password on unlock', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('button:has-text("锁定")').click();
    
    // Try wrong password
    await page.goto('/');
    await page.locator('input[type="password"]').fill('WrongPassword');
    await page.locator('button:has-text("解锁")').click();
    
    await expect(page.locator('text=密码错误')).toBeVisible();
    
    // Courses should remain locked
    await page.goto('/#/learning');
    await expect(page.locator('text=请先解锁保险库')).toBeVisible();
  });
});
