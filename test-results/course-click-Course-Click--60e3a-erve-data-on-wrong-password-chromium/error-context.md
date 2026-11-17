# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should show error and preserve data on wrong password
- Location: e2e/course-click.spec.ts:115:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.course-columns')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.course-columns') with timeout 5000ms
  - waiting for locator('.course-columns')

```

```yaml
- complementary:
  - heading "个人成长" [level=1]
  - paragraph: 生活 • 学习 • 成长
  - navigation:
    - link "今日总览":
      - /url: "#/"
      - img
      - text: 今日总览
    - link "生活日记":
      - /url: "#/diary"
      - img
      - text: 生活日记
    - link "成长学习":
      - /url: "#/learning"
      - img
      - text: 成长学习
    - link "总结回顾":
      - /url: "#/reviews"
      - img
      - text: 总结回顾
    - link "设置":
      - /url: "#/settings"
      - img
      - text: 设置
  - 'button "当前主题: 跟随系统"':
    - img
- main:
  - paragraph: 记录不存在
- img
- heading "安装应用到Desktop" [level=3]
- paragraph: 点击地址栏右侧的安装图标，或在浏览器菜单中选择"安装应用"。
- button "关闭":
  - img
- button "检查更新":
  - img
  - text: 检查更新
```

# Test source

```ts
  27  |   test.beforeEach(async ({ page, context }) => {
  28  |     // Clear browser state for clean test
  29  |     await context.clearCookies();
  30  |     await page.goto('/#/settings');
  31  |     await page.evaluate(async () => {
  32  |       const dbs = await indexedDB.databases();
  33  |       for (const db of dbs) {
  34  |         if (db.name) {
  35  |           indexedDB.deleteDatabase(db.name);
  36  |         }
  37  |       }
  38  |       localStorage.clear();
  39  |       sessionStorage.clear();
  40  |     });
  41  |     await page.reload();
  42  |   });
  43  | 
  44  |   test('should handle local course creation and unlock flow after refresh', async ({ page }) => {
  45  |     // Step 1: Initialize vault with SAME password as fixtures
  46  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  47  |     await page.waitForTimeout(200);
  48  |     await page.locator('#password').fill(FIXTURE_PASSWORD);
  49  |     await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
  50  |     await page.getByRole('button', { name: '确认初始化' }).click();
  51  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  52  | 
  53  |     // Step 2: Navigate to Learning page
  54  |     await page.click('a[href="#/learning"]');
  55  |     await page.waitForURL(/.*#\/learning$/);
  56  | 
  57  |     // Step 3: Wait for page to finish loading
  58  |     await page.waitForLoadState('networkidle');
  59  |     await page.waitForTimeout(500);
  60  |     
  61  |     const courseCount = await page.locator('.learning-card').count();
  62  |     const hasCourses = courseCount > 0;
  63  |     
  64  |     if (!hasCourses) {
  65  |       // Should show empty state with create button
  66  |       await expect(page.locator('button:has-text("创建今日记录")')).toBeVisible({ timeout: 3000 });
  67  |     }
  68  | 
  69  |     // Step 4: Create or navigate to today's course
  70  |     if (!hasCourses) {
  71  |       await page.click('button:has-text("创建今日记录")');
  72  |     } else {
  73  |       // Click the first course card (should be today's if published)
  74  |       await page.click('.learning-card');
  75  |     }
  76  | 
  77  |     // Step 5: Verify detail page loads with 4 columns
  78  |     await page.waitForURL(/.*#\/learning\/.+/);
  79  |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  80  |     
  81  |     const columnCount = await page.locator('.course-column').count();
  82  |     expect(columnCount).toBe(4);
  83  | 
  84  |     // Verify all 4 column headers with Chinese labels
  85  |     await expect(page.locator('h3:has-text("英语")')).toBeVisible();
  86  |     await expect(page.locator('h3:has-text("泰语")')).toBeVisible();
  87  |     await expect(page.locator('h3:has-text("修身养性")')).toBeVisible();
  88  |     await expect(page.locator('h3:has-text("生财有道")')).toBeVisible();
  89  | 
  90  |     // Verify course structure: completion toggles, target minutes
  91  |     await expect(page.locator('.completion-toggle')).toHaveCount(4);
  92  |     await expect(page.locator('.target-time').first()).toBeVisible();
  93  | 
  94  |     // Step 6: Refresh page (locks vault)
  95  |     await page.reload();
  96  |     await page.waitForLoadState('networkidle');
  97  | 
  98  |     // Step 7: Verify UnlockPrompt appears (not just text message)
  99  |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  100 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  101 |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  102 | 
  103 |     // Step 8: Unlock with fixture password
  104 |     await page.fill('input#unlock-password', FIXTURE_PASSWORD);
  105 |     await page.click('button:has-text("解锁")');
  106 | 
  107 |     // Step 9: Verify detail content is accessible again
  108 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  109 |     expect(await page.locator('.course-column').count()).toBe(4);
  110 |     
  111 |     // Verify column headers restored
  112 |     await expect(page.locator('h3:has-text("英语")')).toBeVisible();
  113 |   });
  114 | 
  115 |   test('should show error and preserve data on wrong password', async ({ page }) => {
  116 |     // Initialize vault
  117 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  118 |     await page.waitForTimeout(200);
  119 |     await page.locator('#password').fill(FIXTURE_PASSWORD);
  120 |     await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
  121 |     await page.getByRole('button', { name: '确认初始化' }).click();
  122 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  123 | 
  124 |     // Create a course
  125 |     await page.goto(`/#/learning/${todayDate}`);
  126 |     await page.waitForLoadState('networkidle');
> 127 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  128 | 
  129 |     // Refresh to lock
  130 |     await page.reload();
  131 |     await page.waitForLoadState('networkidle');
  132 | 
  133 |     // Try wrong password
  134 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  135 |     await page.fill('input#unlock-password', 'WrongPassword123!');
  136 |     await page.click('button:has-text("解锁")');
  137 | 
  138 |     // Should show error
  139 |     await expect(page.locator('text=密码错误')).toBeVisible({ timeout: 3000 });
  140 |     
  141 |     // Password field should be cleared for retry
  142 |     expect(await page.locator('input#unlock-password').inputValue()).toBe('');
  143 |     
  144 |     // UnlockPrompt should still be visible (not crashed)
  145 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  146 |     
  147 |     // Now use correct password
  148 |     await page.fill('input#unlock-password', FIXTURE_PASSWORD);
  149 |     await page.click('button:has-text("解锁")');
  150 |     
  151 |     // Should unlock successfully and preserve course data
  152 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  153 |     expect(await page.locator('.course-column').count()).toBe(4);
  154 |   });
  155 | 
  156 |   test('should handle HashRouter navigation without double hash', async ({ page }) => {
  157 |     // Initialize vault
  158 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  159 |     await page.waitForTimeout(200);
  160 |     await page.locator('#password').fill(FIXTURE_PASSWORD);
  161 |     await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
  162 |     await page.getByRole('button', { name: '确认初始化' }).click();
  163 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  164 | 
  165 |     // Navigate to learning and create course
  166 |     await page.goto('/#/learning');
  167 |     await page.waitForLoadState('networkidle');
  168 |     await page.waitForTimeout(500);
  169 |     
  170 |     const courseCount = await page.locator('.learning-card').count();
  171 |     if (courseCount === 0) {
  172 |       await page.click('button:has-text("创建今日记录")');
  173 |     } else {
  174 |       await page.click('.learning-card');
  175 |     }
  176 |     
  177 |     // Wait for navigation
  178 |     await page.waitForURL(/.*#\/learning\/.+/);
  179 |     
  180 |     // Verify URL has single # not ##
  181 |     const url = page.url();
  182 |     expect(url).toContain('#/learning/');
  183 |     expect(url).not.toContain('##');
  184 |     
  185 |     // Verify page loaded properly
  186 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  187 |   });
  188 | 
  189 |   test('should show UnlockPrompt when accessing locked course detail directly', async ({ page }) => {
  190 |     // Simulate accessing /#/learning/2026-11-17 directly without unlock
  191 |     await page.goto(`/#/learning/${todayDate}`);
  192 |     await page.waitForLoadState('networkidle');
  193 | 
  194 |     // Should show UnlockPrompt, not just text
  195 |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  196 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  197 |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  198 | 
  199 |     // Should have back button visible
  200 |     await expect(page.locator('a.back-button')).toBeVisible();
  201 |     
  202 |     // Should have explanatory text
  203 |     await expect(page.locator('text=页面刷新后需要重新输入密码')).toBeVisible();
  204 |   });
  205 | 
  206 |   // Test removed - fixture interception needs more work
  207 |   // Core unlock functionality validated by "should show UnlockPrompt" test
  208 | });
  209 | 
```