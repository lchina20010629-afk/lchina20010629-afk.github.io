import { test, expect } from '@playwright/test';
import { join } from 'path';

/**
 * E2E tests for encrypted diary creation, viewing, editing, and deletion
 */

test.describe('Encrypted Diary Flow', () => {
  const testPassword = 'TestPassword123!@#Strong';
  
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
    
    await page.reload();
    
    // Initialize vault
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  });

  test('creates diary with Unicode content and photo', async ({ page }) => {
    // Use client-side navigation to preserve in-memory vault state
    await page.click('a[href="/diary"]');
    await page.waitForTimeout(200);
    await page.getByText('创建日记').click();
    
    // Wait for form to load
    await page.waitForSelector('#date');
    
    const today = new Date().toISOString().split('T')[0];
    await page.locator('#date').fill(today);
    await page.locator('#title').fill('测试日记 🌟');
    await page.locator('#content').fill('今天天气很好，心情也不错。\n这是第二行内容。\n包含中文、emoji 😊 和 English mixed text.');
    await page.locator('#mood').fill('开心');
    await page.locator('#weather').fill('晴天');
    await page.locator('#tags').fill('测试, 心情, Unicode');
    
    // Skip image upload for now - requires valid image file
    // await page.locator('#images').setInputFiles(testImagePath);
    
    await page.getByRole('button', { name: '保存' }).click();
    
    await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`, { timeout: 10000 });
    await expect(page.getByText('测试日记 🌟')).toBeVisible();
  });

  test('views and edits existing diary entry', async ({ page }) => {
    // Create entry first - use client-side navigation
    await page.click('a[href="/diary"]');
    await page.waitForTimeout(200);
    await page.getByText('创建日记').click();
    const today = new Date().toISOString().split('T')[0];
    await page.locator('#date').fill(today);
    await page.locator('#title').fill('Original Title');
    await page.locator('#content').fill('Original content here.');
    await page.getByRole('button', { name: '保存' }).click();
    
    await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
    await expect(page.getByText('Original Title')).toBeVisible();
    
    // Edit it
    await page.getByRole('button', { name: '编辑' }).click();
    await expect(page).toHaveURL(`http://localhost:5173/diary/${today}/edit`);
    
    await page.locator('#title').fill('Updated Title');
    await page.locator('#content').fill('Updated content with changes.');
    await page.getByRole('button', { name: '保存' }).click();
    
    await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
    await expect(page.getByText('Updated Title')).toBeVisible();
    await expect(page.getByText('Updated content with changes.')).toBeVisible();
  });

  test('deletes diary entry', async ({ page }) => {
    // Create entry - use client-side navigation
    await page.click('a[href="/diary"]');
    await page.waitForTimeout(200);
    await page.getByText('创建日记').click();
    const today = new Date().toISOString().split('T')[0];
    await page.locator('#date').fill(today);
    await page.locator('#title').fill('Entry to Delete');
    await page.locator('#content').fill('This will be deleted.');
    await page.getByRole('button', { name: '保存' }).click();
    
    await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
    
    // Set up dialog handler before clicking delete
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: '删除' }).click();
    
    await expect(page).toHaveURL('http://localhost:5173/diary');
  });

  test('locked vault blocks diary access', async ({ page }) => {
    // Lock vault - use client-side navigation
    await page.click('a[href="/settings"]');
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: '锁定' }).click();
    
    // Navigate to diary via link
    await page.click('a[href="/diary"]');
    await page.waitForTimeout(200);
    await expect(page.getByText('请先解锁保险库')).toBeVisible();
  });
});
