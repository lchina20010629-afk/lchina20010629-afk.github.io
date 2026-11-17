import { test, expect } from '@playwright/test';

const TEST_PASSWORD = 'TestPass123!';

test.describe('Course/Learning Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Capture console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
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
    await page.waitForTimeout(500);
    
    // Should see course entries
    await expect(page.locator('text=2024-03-15')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=2024-03-16')).toBeVisible({ timeout: 10000 });
    
    // Both should show published badge
    const badges = page.locator('.published-badge');
    await expect(badges.first()).toBeVisible();
  });

  test('should navigate to course detail by clicking list item', async ({ page }) => {
    // This test verifies the user's issue: "学习内容点不进去"
    await page.goto('/#/learning');
    await page.waitForTimeout(500);
    
    // Wait for course list to load
    const courseCard = page.locator('a[href="#/learning/2024-03-16"]');
    await expect(courseCard).toBeVisible({ timeout: 10000 });
    
    // Click the course card
    await courseCard.click();
    await page.waitForTimeout(1000);
    
    // Verify we navigated to the course detail page
    expect(page.url()).toContain('#/learning/2024-03-16');
    
    // Verify course content is visible
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=泰语')).toBeVisible();
    await expect(page.locator('text=修身养性')).toBeVisible();
    await expect(page.locator('text=生财有道')).toBeVisible();
  });

  test('should render course detail with 4 columns and materials', async ({ page }) => {
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(1000);
    
    // Check all 4 column headers
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=泰语')).toBeVisible();
    await expect(page.locator('text=修身养性')).toBeVisible();
    await expect(page.locator('text=生财有道')).toBeVisible();
    
    // Check materials from test fixtures
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

  test('should reload and unlock to restore course content - user issue: "初始化密码以后刷新页面无法加载出来"', async ({ page }) => {
    // Navigate to a course
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(1000);
    
    // Verify content loads initially
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=TED Talk: The power of words')).toBeVisible();
    
    // Full page reload (simulates user refreshing)
    await page.reload();
    await page.waitForTimeout(1000);
    
    // After reload, vault is locked - should show locked message
    await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
    
    // Unlock with correct password
    await page.goto('/#/settings');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.waitForTimeout(200);
    await page.locator('#unlock-password').fill(TEST_PASSWORD);
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Navigate back to course
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(1000);
    
    // Content should be visible again
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=TED Talk: The power of words')).toBeVisible();
    await expect(page.locator('text=泰语')).toBeVisible();
  });

  test('should handle deep link to course detail after page refresh', async ({ page }) => {
    // This is another variant of the user's refresh issue
    // User initializes password, then directly visits a course URL
    
    // Go directly to course detail page
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(1000);
    
    // Should load content successfully (vault already unlocked in beforeEach)
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=TED Talk')).toBeVisible();
  });

  test('should track explicit completion toggles locally', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/#/learning/${today}`);
    await page.waitForTimeout(1000);
    
    // Wait for page to load - should show course columns with Chinese labels
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=泰语')).toBeVisible();
    
    // All courses start uncompleted - verify first toggle shows 未完成
    await expect(page.locator('.completion-toggle').first().locator('text=未完成')).toBeVisible({ timeout: 5000 });
    
    // Toggle completion
    await page.locator('.completion-toggle').first().click();
    await page.waitForTimeout(1000); // Wait for save
    
    // Re-query DOM after state update - should now show 已完成
    await expect(page.locator('.completion-toggle').first().locator('text=已完成')).toBeVisible({ timeout: 5000 });
    
    // Lock and reload - vault password is memory-only, so need to unlock again
    await page.goto('/#/settings');
    await page.locator('button:has-text("锁定")').click();
    await page.waitForTimeout(500);
    
    // Unlock again
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.waitForTimeout(200);
    await page.locator('#unlock-password').fill(TEST_PASSWORD);
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Navigate back - should persist
    await page.goto(`/#/learning/${today}`);
    await page.waitForTimeout(1000);
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.completion-toggle').first().locator('text=已完成')).toBeVisible({ timeout: 5000 });
  });

  test('should store and display reflection locally', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/#/learning/${today}`);
    await page.waitForTimeout(1000);
    
    // Wait for page to load
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    
    // Enter reflection in first column (auto-saves on change)
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill('今天语法学习进步很大！');
    await page.waitForTimeout(1000); // Wait for auto-save
    
    // Lock and unlock to verify persistence
    await page.goto('/#/settings');
    await page.locator('button:has-text("锁定")').click();
    await page.waitForTimeout(500);
    
    // Unlock
    await page.getByRole('button', { name: '解锁' }).first().click();
    await page.waitForTimeout(200);
    await page.locator('#unlock-password').fill(TEST_PASSWORD);
    await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Navigate back - should persist
    await page.goto(`/#/learning/${today}`);
    await page.waitForTimeout(1000);
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('textarea').first()).toHaveValue('今天语法学习进步很大！', { timeout: 10000 });
  });

  test('should clear course data on lock', async ({ page }) => {
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=TED Talk')).toBeVisible({ timeout: 10000 });
    
    // Lock
    await page.goto('/#/settings');
    await page.locator('button:has-text("锁定")').click();
    
    // Navigate back - should show locked message
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(500);
    await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=TED Talk')).not.toBeVisible();
  });

  test('should not allow editing published courses', async ({ page }) => {
    await page.goto('/#/learning/2024-03-16');
    await page.waitForTimeout(1000);
    
    // Wait for content to load
    await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
    
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
    await page.waitForTimeout(500);
    await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  });
});
