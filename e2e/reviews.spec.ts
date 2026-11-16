import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

const TEST_PASSWORD = 'TestPass123!';
const FIXTURES_DIR = '/tmp/test-course-fixtures';

test.describe('Review Features', () => {
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

  test('should load and display published reviews', async ({ page }) => {
    await page.goto('/#/reviews');
    await page.waitForTimeout(1000); // Wait for manifest to load
    
    // Should see all 3 review types
    await expect(page.locator('.review-period:has-text("2024-W11")')).toBeVisible({ timeout: 10000 }); // weekly
    await expect(page.locator('.review-period:has-text("2024-03")')).toBeVisible(); // monthly
    // Yearly: exactly "2024", not containing other text
    await expect(page.locator('.review-period').filter({ hasText: /^2024$/ })).toBeVisible();
    
    // Should see type labels
    await expect(page.locator('text=周总结').first()).toBeVisible();
    await expect(page.locator('text=月总结').first()).toBeVisible();
    await expect(page.locator('text=年终总结').first()).toBeVisible();
  });

  test('should render weekly review detail', async ({ page }) => {
    await page.goto('/#/reviews/weekly/2024-W11');
    await page.waitForTimeout(1000); // Wait for loading
    
    // Check for title in input field or as text
    const titleInput = page.locator('input#title');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(titleInput).toHaveValue('第11周总结');
    
    // Check content in textarea
    const contentArea = page.locator('textarea#content');
    await expect(contentArea).toHaveValue(/本周完成了两天的学习任务/);
    
    // Published reviews should have disabled inputs
    await expect(titleInput).toBeDisabled();
  });

  test('should render monthly review detail', async ({ page }) => {
    await page.goto('/#/reviews/monthly/2024-03');
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input#title');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(titleInput).toHaveValue('三月总结');
    
    const contentArea = page.locator('textarea#content');
    await expect(contentArea).toHaveValue(/三月份建立了四列学习法的框架/);
  });

  test('should render yearly review detail', async ({ page }) => {
    await page.goto('/#/reviews/yearly/2024');
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input#title');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(titleInput).toHaveValue('2024年度总结');
    
    const contentArea = page.locator('textarea#content');
    await expect(contentArea).toHaveValue(/2024年是个人成长系统化的一年/);
  });

  test('should allow editing draft review', async ({ page }) => {
    await page.goto('/#/reviews/weekly/2099-W99');
    await page.waitForTimeout(1000);
    
    // Should create new draft
    const titleInput = page.locator('input#title');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(titleInput).not.toBeDisabled();
    
    await titleInput.fill('Test Week Review');
    await page.locator('textarea#content').fill('This is a test review');
    await page.locator('button:has-text("保存")').click();
    await page.waitForTimeout(500);
    
    // Reload - should persist
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator('input#title')).toHaveValue('Test Week Review', { timeout: 10000 });
    await expect(page.locator('textarea#content')).toHaveValue('This is a test review');
  });

  test('should clear reviews on lock', async ({ page }) => {
    await page.goto('/#/reviews/weekly/2024-W11');
    await page.waitForTimeout(1000);
    // Verify content is loaded
    await expect(page.locator('input#title')).toHaveValue('第11周总结', { timeout: 10000 });
    
    // Lock
    await page.goto('/#/settings');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("锁定")').click();
    await page.waitForTimeout(500);
    
    // Navigate back - should show locked message
    await page.goto('/#/reviews');
    await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  });

  test('should use exact period keys', async ({ page }) => {
    await page.goto('/#/reviews');
    
    // Check quick create buttons use current period format
    const quickButtons = page.locator('.action-buttons a');
    await expect(quickButtons.nth(0)).toContainText('W'); // weekly: YYYY-Www
    await expect(quickButtons.nth(1)).toContainText('-'); // monthly: YYYY-MM
    await expect(quickButtons.nth(2)).toHaveAttribute('href', /#\/reviews\/yearly\/\d{4}$/); // yearly: YYYY
  });
});
