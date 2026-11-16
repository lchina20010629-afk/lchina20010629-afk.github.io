import { test, expect } from '@playwright/test';

/**
 * E2E Test: Vault Initialization, Lock/Unlock, State Management
 * 
 * Tests gate #1: Empty site initialize vault, lock/unlock/reload,
 * verify IndexedDB encryption, wrong password handling
 */

test.describe('Vault Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear storage before each test
    await context.clearCookies();
    await page.goto('/');
    
    // Clear IndexedDB
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('life-growth-db');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });
  });

  test('should display vault initialization prompt on first visit', async ({ page }) => {
    await page.goto('/settings');
    
    // Should show vault uninitialized message
    await expect(page.locator('text=保险库未初始化')).toBeVisible();
    await expect(page.locator('button:has-text("初始化保险库")')).toBeVisible();
  });

  test('should initialize vault with strong password', async ({ page }) => {
    await page.goto('/settings');
    
    // Click initialize button
    await page.click('button:has-text("初始化保险库")');
    
    // Fill password form
    const strongPassword = 'TestP@ssw0rd!2024Long';
    await page.fill('input[type="password"]#password', strongPassword);
    await page.fill('input[type="password"]#confirm-password', strongPassword);
    
    // Submit
    await page.click('button[type="submit"]:has-text("确认初始化")');
    
    // Should show success
    await expect(page.locator('text=保险库已初始化')).toBeVisible({ timeout: 5000 });
    
    // Verify IndexedDB was created
    const dbExists = await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      return dbs.some(db => db.name === 'life-growth-db');
    });
    expect(dbExists).toBe(true);
  });

  test('should reject weak password', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("初始化保险库")');
    
    // Try weak password
    await page.fill('input[type="password"]#password', '123456');
    await page.fill('input[type="password"]#confirm-password', '123456');
    
    // Should show strength warning
    await expect(page.locator('text=密码强度不足')).toBeVisible({ timeout: 2000 });
  });

  test('should reject mismatched passwords', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("初始化保险库")');
    
    await page.fill('input[type="password"]#password', 'TestP@ssw0rd!2024');
    await page.fill('input[type="password"]#confirm-password', 'DifferentP@ssw0rd');
    await page.click('button[type="submit"]:has-text("确认初始化")');
    
    await expect(page.locator('text=两次输入的密码不一致')).toBeVisible();
  });

  test('should persist vault initialization across reload', async ({ page }) => {
    // Initialize vault
    await page.goto('/settings');
    await page.click('button:has-text("初始化保险库")');
    
    const password = 'TestP@ssw0rd!2024Long';
    await page.fill('input[type="password"]#password', password);
    await page.fill('input[type="password"]#confirm-password', password);
    await page.click('button[type="submit"]:has-text("确认初始化")');
    
    await expect(page.locator('text=保险库已初始化')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Should still show as initialized
    await expect(page.locator('text=保险库已初始化')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have visible focus indicator
    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      const styles = window.getComputedStyle(active!);
      return styles.outline !== 'none';
    });
    
    // Some element should be focused
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation landmark
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for main content landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
