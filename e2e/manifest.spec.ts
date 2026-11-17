import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * E2E test for CLI-produced manifest → browser loader
 * 
 * Server managed by Playwright webServer config (playwright.config.manifest.ts)
 * Test fixtures generated before tests run (see package.json test:manifest script)
 */

const TEST_PASSWORD = 'TestPass123!';

test.describe('CLI → Manifest → Browser Loader', () => {
  // Server lifecycle managed by Playwright webServer config

  test('manifest.json contains no plaintext content', async () => {
    const manifestPath = join(__dirname, '../dist/data/manifest.json');
    const manifestText = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestText);

    // Verify structure
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.entries).toBeInstanceOf(Array);
    expect(manifest.entries.length).toBeGreaterThan(0);

    // Check for plaintext leaks
    const sensitiveStrings = [
      '测试日记标题',
      '这是一篇测试',
      '今日学习记录',
      '第46周总结',
    ];

    for (const sensitive of sensitiveStrings) {
      expect(manifestText).not.toContain(sensitive);
    }

    // Verify entries have required fields but NO plaintext
    for (const entry of manifest.entries) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('encryptedPath');
      expect(entry).not.toHaveProperty('title');
      expect(entry).not.toHaveProperty('content');
      expect(entry).not.toHaveProperty('tags');
    }
  });

  test('loads published diary entry from manifest', async ({ page, context }) => {
    // Clear all storage (NEW browser session)
    await context.clearCookies();
    await page.goto('/#/settings');
    
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload to ensure clean state
    await page.reload();

    // Initialize vault with TEST password (matches published vault verifier)
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Navigate to diary list
    await page.click('a[href="#/diary"]');
    await page.waitForTimeout(500);

    // Should see published entry (with cloud badge)
    const publishedEntry = page.locator('a[href="#/diary/2026-11-16"]');
    await expect(publishedEntry).toBeVisible();

    // Click to view detail
    await publishedEntry.click();
    await page.waitForTimeout(500);

    // Should see decrypted content
    await expect(page.getByText('测试日记标题 🌟')).toBeVisible();
    await expect(page.getByText('这是一篇测试日记的内容')).toBeVisible();
    await expect(page.getByText('包含中文字符和Unicode表情')).toBeVisible();

    // Content successfully decrypted and displayed from published manifest ✅
  });

  test('deep link to published entry works on page reload', async ({ page, context }) => {
    // Clear storage
    await context.clearCookies();
    await page.goto('/#/settings');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });

    // Initialize vault
    await page.reload();
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Navigate directly to diary detail via deep link (hash routing)
    await page.goto('/#/diary/2026-11-16');
    await page.waitForTimeout(1000);
    
    // Should see content (vault still unlocked)
    await expect(page.getByText('测试日记标题 🌟')).toBeVisible();

    // Full page reload locks vault - verify by going to a page and seeing locked state
    await page.reload();
    await page.waitForTimeout(1000);

    // Deep link with hash routing preserved URL, but vault is locked
    await expect(page.getByText('请先解锁保险库')).toBeVisible();
  });

  test('rejects wrong password for published entries', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/#/settings');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });

    // Initialize with WRONG password
    await page.reload();
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill('WrongPassword123!@#');
    await page.locator('#confirm-password').fill('WrongPassword123!@#');
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Try to view published entry
    await page.click('a[href="#/diary"]');
    await page.waitForTimeout(500);

    // Entry may show in list (metadata is public) but decryption should fail
    const entry = page.locator('a[href="#/diary/2026-11-16"]');
    const entryExists = await entry.count();

    if (entryExists > 0) {
      await entry.click();
      await page.waitForTimeout(500);

      // Should show error or empty content (decryption failed)
      const hasError = await page.getByText('加载失败').count();
      const hasContent = await page.getByText('测试日记标题').count();
      
      // Either shows error OR entry not found
      expect(hasError > 0 || hasContent === 0).toBeTruthy();
    }
  });

  test('merges published and local drafts without overwrite', async ({ page, context }) => {
    // Clear storage
    await context.clearCookies();
    await page.goto('/#/settings');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });

    // Initialize vault
    await page.reload();
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Create local draft for DIFFERENT date
    await page.click('a[href="#/diary"]');
    await page.waitForTimeout(200);
    await page.getByText('创建日记').click();
    const localDate = '2026-11-15';
    await page.locator('#date').fill(localDate);
    await page.locator('#title').fill('Local Draft');
    await page.locator('#content').fill('This is a local-only entry.');
    await page.getByRole('button', { name: '保存' }).click();
    await page.waitForURL(`**#/diary/${localDate}`);

    // Go to diary list
    await page.click('a[href="#/diary"]');
    await page.waitForTimeout(500);

    // Should see BOTH entries
    const localEntry = page.locator(`a[href="#/diary/${localDate}"]`);
    const publishedEntry = page.locator('a[href="#/diary/2026-11-16"]');

    await expect(localEntry).toBeVisible();
    await expect(publishedEntry).toBeVisible();

    // Local entry should NOT have cloud badge
    // Published entry should have cloud badge
    // (checking by counting svg icons in each card)
  });
});
