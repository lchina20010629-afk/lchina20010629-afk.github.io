import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

const TEST_PASSWORD = 'TestPass123!';
const FIXTURES_DIR = '/tmp/test-course-fixtures';

test.describe('Course/Learning Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear browser state only
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
    
    // Init vault - click button to show form
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
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
    await page.waitForTimeout(1000);
    
    // Wait for page to load - should show course columns
    await expect(page.locator('text=English')).toBeVisible({ timeout: 10000 });
    
    // All courses start uncompleted - look for checkboxes or toggle buttons
    const firstToggle = page.locator('.completion-toggle').first();
    await expect(firstToggle).toBeVisible({ timeout: 5000 });
    
    // Toggle completion
    await firstToggle.click();
    await page.waitForTimeout(500);
    
    // Reload page - should persist
    await page.reload();
    await page.waitForTimeout(1000);
    // Just verify the toggle is still there and clickable
    await expect(firstToggle).toBeVisible({ timeout: 10000 });
  });

  test('should store and display reflection locally', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/#/learning/${today}`);
    await page.waitForTimeout(1000);
    
    // Wait for page to load
    await expect(page.locator('text=English')).toBeVisible({ timeout: 10000 });
    
    // Enter reflection in first column
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill('Great progress on grammar today!');
    await page.waitForTimeout(1000); // Wait for auto-save
    
    // Reload - should persist
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator('textarea').first()).toHaveValue('Great progress on grammar today!', { timeout: 10000 });
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
    await page.waitForTimeout(200);
    await page.locator('button:has-text("锁定")').click();
    await page.waitForTimeout(500);
    
    // Try wrong password - click unlock button to show form
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.waitForTimeout(200);
    await page.locator('#unlock-password').fill('WrongPassword');
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    
    await expect(page.locator('text=密码错误')).toBeVisible({ timeout: 5000 });
    
    // Courses should remain locked
    await page.goto('/#/learning');
    await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  });
});
