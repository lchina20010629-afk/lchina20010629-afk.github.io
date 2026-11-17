import { test, expect } from '@playwright/test';
import { setupPublishedCourseFixtures, FIXTURE_PASSWORD } from './fixtures/course-fixture';

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Test: Complete course click flow with published content
 * 
 * User Issue: "学习内容点不进去" (Can't click into learning content)
 * 
 * Validates:
 * - Init vault with synthetic password
 * - Load published course list
 * - Click course card navigates to detail page
 * - Detail page shows 4 columns with content
 * - Refresh locks vault
 * - UnlockPrompt appears with password field
 * - After unlock, detail content is accessible again
 * - Content structure supports both root and wrapped formats
 */
test.describe('Course Click and Detail Flow', () => {
  const todayDate = getTodayDate();

  test.beforeEach(async ({ page, context }) => {
    // Setup synthetic published course fixtures BEFORE clearing state
    await setupPublishedCourseFixtures(page, [todayDate]);
    
    // Clear browser state
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
  });

  test('should handle complete course flow: init → list → click → detail → refresh → unlock → detail', async ({ page }) => {
    // Step 1: Initialize vault with SAME password as fixtures
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    await page.locator('#password').fill(FIXTURE_PASSWORD);
    await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Step 2: Navigate to Learning page
    await page.click('a[href="#/learning"]');
    await page.waitForURL(/.*#\/learning$/);

    // Step 3: Wait for page to finish loading
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const courseCount = await page.locator('.learning-card').count();
    const hasCourses = courseCount > 0;
    
    if (!hasCourses) {
      // Should show empty state with create button
      await expect(page.locator('button:has-text("创建今日记录")')).toBeVisible({ timeout: 3000 });
    }

    // Step 4: Create or navigate to today's course
    if (!hasCourses) {
      await page.click('button:has-text("创建今日记录")');
    } else {
      // Click the first course card (should be today's if published)
      await page.click('.learning-card');
    }

    // Step 5: Verify detail page loads with 4 columns
    await page.waitForURL(/.*#\/learning\/.+/);
    await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
    
    const columnCount = await page.locator('.course-column').count();
    expect(columnCount).toBe(4);

    // Verify all 4 column headers with Chinese labels
    await expect(page.locator('h3:has-text("英语")')).toBeVisible();
    await expect(page.locator('h3:has-text("泰语")')).toBeVisible();
    await expect(page.locator('h3:has-text("修身养性")')).toBeVisible();
    await expect(page.locator('h3:has-text("生财有道")')).toBeVisible();

    // Verify course structure: completion toggles, target minutes
    await expect(page.locator('.completion-toggle')).toHaveCount(4);
    await expect(page.locator('.target-time').first()).toBeVisible();
    
    // Verify actual content sections exist (materials, exercises)
    await expect(page.locator('h4:has-text("学习材料")')).toBeVisible();
    await expect(page.locator('h4:has-text("练习内容")')).toBeVisible();
    
    // Verify specific fixture content is readable
    await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
    await expect(page.locator('text=Vocabulary flashcards')).toBeVisible();

    // Step 6: Refresh page (locks vault)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 7: Verify UnlockPrompt appears (not just text message)
    await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input#unlock-password')).toBeVisible();
    await expect(page.locator('button:has-text("解锁")')).toBeVisible();

    // Step 8: Unlock with fixture password
    await page.fill('input#unlock-password', FIXTURE_PASSWORD);
    await page.click('button:has-text("解锁")');

    // Step 9: Verify detail content is accessible again with full data
    await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
    expect(await page.locator('.course-column').count()).toBe(4);

    // Verify all content sections restored after unlock
    await expect(page.locator('h4:has-text("学习材料")')).toBeVisible();
    await expect(page.locator('h4:has-text("练习内容")')).toBeVisible();
    await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
    await expect(page.locator('text=Vocabulary flashcards')).toBeVisible();
  });

  test('should handle published course with wrapped content structure', async ({ page }) => {
    // Fixtures already setup with wrapped {content: {courses: []}} format in beforeEach
    
    // Initialize vault with fixture password
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    await page.locator('#password').fill(FIXTURE_PASSWORD);
    await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Navigate to learning
    await page.click('a[href="#/learning"]');
    await page.waitForURL(/.*#\/learning$/);

    // Wait for course to load
    await page.locator('.learning-card').first().waitFor({ state: 'visible', timeout: 5000 });
    
    // Click course to verify wrapped structure is properly unwrapped
    await page.click('.learning-card');
    await page.waitForURL(/.*#\/learning\/.+/);
    
    // Verify 4 columns loaded despite wrapped structure
    await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
    const columnCount = await page.locator('.course-column').count();
    expect(columnCount).toBe(4);
    
    // Verify actual content (proves actualData = courseData.content || courseData works)
    await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
  });

  test('should show UnlockPrompt when accessing locked course detail directly', async ({ page }) => {
    // Simulate accessing /#/learning/2026-11-17 directly without unlock
    await page.goto(`/#/learning/${todayDate}`);
    await page.waitForLoadState('networkidle');

    // Should show UnlockPrompt, not just text
    await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input#unlock-password')).toBeVisible();
    await expect(page.locator('button:has-text("解锁")')).toBeVisible();

    // Should have back button visible
    await expect(page.locator('a.back-button')).toBeVisible();
    
    // Should have explanatory text
    await expect(page.locator('text=页面刷新后需要重新输入密码')).toBeVisible();
  });

  test('should preserve course detail state after unlock from prompt', async ({ page }) => {
    // Initialize vault with fixture password
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    await page.locator('#password').fill(FIXTURE_PASSWORD);
    await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });

    // Navigate to course detail
    await page.goto(`/#/learning/${todayDate}`);
    await page.waitForLoadState('networkidle');
    
    // Verify loaded with full content
    await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
    
    // Refresh to lock
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Unlock via prompt
    await expect(page.locator('input#unlock-password')).toBeVisible();
    await page.fill('input#unlock-password', FIXTURE_PASSWORD);
    await page.click('button:has-text("解锁")');

    // Should reload same page with content preserved
    await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
    expect(await page.url()).toContain(`/learning/${todayDate}`);
  });
});
