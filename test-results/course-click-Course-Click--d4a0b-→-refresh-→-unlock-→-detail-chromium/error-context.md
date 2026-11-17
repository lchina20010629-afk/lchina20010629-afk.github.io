# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should handle complete course flow: init → list → click → detail → refresh → unlock → detail
- Location: e2e/course-click.spec.ts:47:3

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
  1   | import { test, expect } from '@playwright/test';
  2   | import { setupPublishedCourseFixtures, FIXTURE_PASSWORD } from './fixtures/course-fixture';
  3   | 
  4   | function getTodayDate(): string {
  5   |   const now = new Date();
  6   |   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  7   | }
  8   | 
  9   | /**
  10  |  * Test: Complete course click flow with published content
  11  |  * 
  12  |  * User Issue: "学习内容点不进去" (Can't click into learning content)
  13  |  * 
  14  |  * Validates:
  15  |  * - Init vault with synthetic password
  16  |  * - Load published course list
  17  |  * - Click course card navigates to detail page
  18  |  * - Detail page shows 4 columns with content
  19  |  * - Refresh locks vault
  20  |  * - UnlockPrompt appears with password field
  21  |  * - After unlock, detail content is accessible again
  22  |  * - Content structure supports both root and wrapped formats
  23  |  */
  24  | test.describe('Course Click and Detail Flow', () => {
  25  |   const todayDate = getTodayDate();
  26  | 
  27  |   test.beforeEach(async ({ page, context }) => {
  28  |     // Setup synthetic published course fixtures BEFORE clearing state
  29  |     await setupPublishedCourseFixtures(page, [todayDate]);
  30  |     
  31  |     // Clear browser state
  32  |     await context.clearCookies();
  33  |     await page.goto('/#/settings');
  34  |     await page.evaluate(async () => {
  35  |       const dbs = await indexedDB.databases();
  36  |       for (const db of dbs) {
  37  |         if (db.name) {
  38  |           indexedDB.deleteDatabase(db.name);
  39  |         }
  40  |       }
  41  |       localStorage.clear();
  42  |       sessionStorage.clear();
  43  |     });
  44  |     await page.reload();
  45  |   });
  46  | 
  47  |   test('should handle complete course flow: init → list → click → detail → refresh → unlock → detail', async ({ page }) => {
  48  |     // Step 1: Initialize vault with SAME password as fixtures
  49  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  50  |     await page.waitForTimeout(200);
  51  |     await page.locator('#password').fill(FIXTURE_PASSWORD);
  52  |     await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
  53  |     await page.getByRole('button', { name: '确认初始化' }).click();
  54  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  55  | 
  56  |     // Step 2: Navigate to Learning page
  57  |     await page.click('a[href="#/learning"]');
  58  |     await page.waitForURL(/.*#\/learning$/);
  59  | 
  60  |     // Step 3: Wait for page to finish loading
  61  |     await page.waitForLoadState('networkidle');
  62  |     await page.waitForTimeout(500);
  63  |     
  64  |     const courseCount = await page.locator('.learning-card').count();
  65  |     const hasCourses = courseCount > 0;
  66  |     
  67  |     if (!hasCourses) {
  68  |       // Should show empty state with create button
  69  |       await expect(page.locator('button:has-text("创建今日记录")')).toBeVisible({ timeout: 3000 });
  70  |     }
  71  | 
  72  |     // Step 4: Create or navigate to today's course
  73  |     if (!hasCourses) {
  74  |       await page.click('button:has-text("创建今日记录")');
  75  |     } else {
  76  |       // Click the first course card (should be today's if published)
  77  |       await page.click('.learning-card');
  78  |     }
  79  | 
  80  |     // Step 5: Verify detail page loads with 4 columns
  81  |     await page.waitForURL(/.*#\/learning\/.+/);
> 82  |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  83  |     
  84  |     const columnCount = await page.locator('.course-column').count();
  85  |     expect(columnCount).toBe(4);
  86  | 
  87  |     // Verify all 4 column headers with Chinese labels
  88  |     await expect(page.locator('h3:has-text("英语")')).toBeVisible();
  89  |     await expect(page.locator('h3:has-text("泰语")')).toBeVisible();
  90  |     await expect(page.locator('h3:has-text("修身养性")')).toBeVisible();
  91  |     await expect(page.locator('h3:has-text("生财有道")')).toBeVisible();
  92  | 
  93  |     // Verify course structure: completion toggles, target minutes
  94  |     await expect(page.locator('.completion-toggle')).toHaveCount(4);
  95  |     await expect(page.locator('.target-time').first()).toBeVisible();
  96  |     
  97  |     // Verify actual content sections exist (materials, exercises)
  98  |     await expect(page.locator('h4:has-text("学习材料")')).toBeVisible();
  99  |     await expect(page.locator('h4:has-text("练习内容")')).toBeVisible();
  100 |     
  101 |     // Verify specific fixture content is readable
  102 |     await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
  103 |     await expect(page.locator('text=Vocabulary flashcards')).toBeVisible();
  104 | 
  105 |     // Step 6: Refresh page (locks vault)
  106 |     await page.reload();
  107 |     await page.waitForLoadState('networkidle');
  108 | 
  109 |     // Step 7: Verify UnlockPrompt appears (not just text message)
  110 |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  111 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  112 |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  113 | 
  114 |     // Step 8: Unlock with fixture password
  115 |     await page.fill('input#unlock-password', FIXTURE_PASSWORD);
  116 |     await page.click('button:has-text("解锁")');
  117 | 
  118 |     // Step 9: Verify detail content is accessible again with full data
  119 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  120 |     expect(await page.locator('.course-column').count()).toBe(4);
  121 | 
  122 |     // Verify all content sections restored after unlock
  123 |     await expect(page.locator('h4:has-text("学习材料")')).toBeVisible();
  124 |     await expect(page.locator('h4:has-text("练习内容")')).toBeVisible();
  125 |     await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
  126 |     await expect(page.locator('text=Vocabulary flashcards')).toBeVisible();
  127 |   });
  128 | 
  129 |   test('should handle published course with wrapped content structure', async ({ page }) => {
  130 |     // Fixtures already setup with wrapped {content: {courses: []}} format in beforeEach
  131 |     
  132 |     // Initialize vault with fixture password
  133 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  134 |     await page.waitForTimeout(200);
  135 |     await page.locator('#password').fill(FIXTURE_PASSWORD);
  136 |     await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
  137 |     await page.getByRole('button', { name: '确认初始化' }).click();
  138 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  139 | 
  140 |     // Navigate to learning
  141 |     await page.click('a[href="#/learning"]');
  142 |     await page.waitForURL(/.*#\/learning$/);
  143 | 
  144 |     // Wait for course to load
  145 |     await page.locator('.learning-card').first().waitFor({ state: 'visible', timeout: 5000 });
  146 |     
  147 |     // Click course to verify wrapped structure is properly unwrapped
  148 |     await page.click('.learning-card');
  149 |     await page.waitForURL(/.*#\/learning\/.+/);
  150 |     
  151 |     // Verify 4 columns loaded despite wrapped structure
  152 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  153 |     const columnCount = await page.locator('.course-column').count();
  154 |     expect(columnCount).toBe(4);
  155 |     
  156 |     // Verify actual content (proves actualData = courseData.content || courseData works)
  157 |     await expect(page.locator('text=TED Talk: The future of learning')).toBeVisible();
  158 |   });
  159 | 
  160 |   test('should show UnlockPrompt when accessing locked course detail directly', async ({ page }) => {
  161 |     // Simulate accessing /#/learning/2026-11-17 directly without unlock
  162 |     await page.goto(`/#/learning/${todayDate}`);
  163 |     await page.waitForLoadState('networkidle');
  164 | 
  165 |     // Should show UnlockPrompt, not just text
  166 |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  167 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  168 |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  169 | 
  170 |     // Should have back button visible
  171 |     await expect(page.locator('a.back-button')).toBeVisible();
  172 |     
  173 |     // Should have explanatory text
  174 |     await expect(page.locator('text=页面刷新后需要重新输入密码')).toBeVisible();
  175 |   });
  176 | 
  177 |   test('should preserve course detail state after unlock from prompt', async ({ page }) => {
  178 |     // Initialize vault with fixture password
  179 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  180 |     await page.waitForTimeout(200);
  181 |     await page.locator('#password').fill(FIXTURE_PASSWORD);
  182 |     await page.locator('#confirm-password').fill(FIXTURE_PASSWORD);
```