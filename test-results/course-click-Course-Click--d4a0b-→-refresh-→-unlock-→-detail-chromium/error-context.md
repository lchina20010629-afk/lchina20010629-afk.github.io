# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should handle complete course flow: init → list → click → detail → refresh → unlock → detail
- Location: e2e/course-click.spec.ts:44:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - complementary [ref=f1e4]:
      - generic [ref=f1e5]:
        - heading "个人成长" [level=1] [ref=f1e6]
        - paragraph [ref=f1e7]: 生活 • 学习 • 成长
      - navigation [ref=f1e8]:
        - link "今日总览" [ref=f1e9] [cursor=pointer]:
          - /url: "#/"
        - link "生活日记" [ref=f1e14] [cursor=pointer]:
          - /url: "#/diary"
        - link "成长学习" [active] [ref=f1e18] [cursor=pointer]:
          - /url: "#/learning"
        - link "总结回顾" [ref=f1e22] [cursor=pointer]:
          - /url: "#/reviews"
        - link "设置" [ref=f1e27] [cursor=pointer]:
          - /url: "#/settings"
      - 'button "当前主题: 跟随系统" [ref=f1e33] [cursor=pointer]'
    - main [ref=f1e36]:
      - generic [ref=f1e37]:
        - generic [ref=f1e39]:
          - heading "成长学习" [level=1] [ref=f1e40]
          - link "今日学习" [ref=f1e41] [cursor=pointer]:
            - /url: "#/learning#/learning/2026-11-17"
        - generic [ref=f1e43]:
          - heading "四列学习法" [level=3] [ref=f1e44]
          - generic [ref=f1e45]:
            - generic [ref=f1e46]:
              - strong [ref=f1e47]: 英语
              - generic [ref=f1e48]: 10分钟
            - generic [ref=f1e49]:
              - strong [ref=f1e50]: 泰语
              - generic [ref=f1e51]: 8分钟
            - generic [ref=f1e52]:
              - strong [ref=f1e53]: 修身养性
              - generic [ref=f1e54]: 6分钟
            - generic [ref=f1e55]:
              - strong [ref=f1e56]: 生财有道
              - generic [ref=f1e57]: 6分钟
        - link "2026-11-17 已发布" [ref=f1e59] [cursor=pointer]:
          - /url: "#/learning#/learning/2026-11-17"
          - generic [ref=f1e60]: 2026-11-17
          - generic [ref=f1e63]: 已发布
  - button "检查更新" [ref=f1e64] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | function getTodayDate(): string {
  4   |   const now = new Date();
  5   |   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  6   | }
  7   | 
  8   | /**
  9   |  * Test: Complete course click flow with published content
  10  |  * 
  11  |  * User Issue: "学习内容点不进去" (Can't click into learning content)
  12  |  * 
  13  |  * Validates:
  14  |  * - Init vault with synthetic password
  15  |  * - Load published course list
  16  |  * - Click course card navigates to detail page
  17  |  * - Detail page shows 4 columns with content
  18  |  * - Refresh locks vault
  19  |  * - UnlockPrompt appears with password field
  20  |  * - After unlock, detail content is accessible again
  21  |  * - Content structure supports both root and wrapped formats
  22  |  */
  23  | test.describe('Course Click and Detail Flow', () => {
  24  |   const testPassword = 'TestPass123!';
  25  |   const todayDate = getTodayDate();
  26  | 
  27  |   test.beforeEach(async ({ page, context }) => {
  28  |     // Clear browser state
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
  44  |   test('should handle complete course flow: init → list → click → detail → refresh → unlock → detail', async ({ page }) => {
  45  |     // Step 1: Initialize vault (already on settings page from beforeEach)
  46  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  47  |     await page.waitForTimeout(200);
  48  |     await page.locator('#password').fill(testPassword);
  49  |     await page.locator('#confirm-password').fill(testPassword);
  50  |     await page.getByRole('button', { name: '确认初始化' }).click();
  51  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  52  | 
  53  |     // Step 2: Navigate to Learning page
  54  |     await page.click('a[href="#/learning"]');
  55  |     await page.waitForURL(/.*#\/learning$/);
  56  | 
  57  |     // Step 3: Verify course list loads (or empty state appears)
  58  |     const hasCourses = await page.locator('.learning-card').count() > 0;
  59  |     const hasEmptyState = await page.locator('text=暂无学习记录').isVisible().catch(() => false);
  60  |     
> 61  |     expect(hasCourses || hasEmptyState).toBe(true);
      |                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  62  | 
  63  |     // Step 4: Create or navigate to today's course
  64  |     if (!hasCourses) {
  65  |       await page.click('button:has-text("创建今日记录")');
  66  |     } else {
  67  |       // Click the first course card (should be today's if published)
  68  |       await page.click('.learning-card');
  69  |     }
  70  | 
  71  |     // Step 5: Verify detail page loads with 4 columns
  72  |     await page.waitForURL(/.*#\/learning\/.+/);
  73  |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  74  |     
  75  |     const columnCount = await page.locator('.course-column').count();
  76  |     expect(columnCount).toBe(4);
  77  | 
  78  |     // Verify column headers show target minutes
  79  |     const columns = ['english', 'thai', 'character', 'wealth'];
  80  |     for (const col of columns) {
  81  |       const columnSelector = `.course-column:has(h3:has-text("${col === 'english' ? 'English' : col === 'thai' ? 'ไทย' : col === 'character' ? '修身养性' : '生财有道'}"))`;
  82  |       await expect(page.locator(columnSelector)).toBeVisible();
  83  |     }
  84  | 
  85  |     // Verify course structure fields are accessible
  86  |     await expect(page.locator('.completion-toggle')).toHaveCount(4);
  87  |     await expect(page.locator('.target-time').first()).toBeVisible();
  88  | 
  89  |     // Step 6: Refresh page (locks vault)
  90  |     await page.reload();
  91  |     await page.waitForLoadState('networkidle');
  92  | 
  93  |     // Step 7: Verify UnlockPrompt appears (not just text message)
  94  |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  95  |     await expect(page.locator('input#unlock-password')).toBeVisible();
  96  |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  97  | 
  98  |     // Step 8: Unlock with password
  99  |     await page.fill('input#unlock-password', testPassword);
  100 |     await page.click('button:has-text("解锁")');
  101 | 
  102 |     // Step 9: Verify detail content is accessible again
  103 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  104 |     expect(await page.locator('.course-column').count()).toBe(4);
  105 | 
  106 |     // Verify content sections are present (materials, exercises, reflection)
  107 |     // Even with totalMinutes=0, columns should be clickable and show structure
  108 |     const firstColumn = page.locator('.course-column').first();
  109 |     await expect(firstColumn.locator('.column-header')).toBeVisible();
  110 |     await expect(firstColumn.locator('.completion-toggle')).toBeVisible();
  111 |   });
  112 | 
  113 |   test('should handle published course with wrapped content structure', async ({ page }) => {
  114 |     // This test validates the dual structure support:
  115 |     // 1. Root: {courses: [...], totalMinutes, notes}
  116 |     // 2. Wrapped: {content: {courses: [...], totalMinutes, notes}}
  117 | 
  118 |     // Mock published manifest with wrapped structure
  119 |     await page.route('**/data/manifest.json', async route => {
  120 |       await route.fulfill({
  121 |         status: 200,
  122 |         contentType: 'application/json',
  123 |         body: JSON.stringify({
  124 |           verifier: {
  125 |             salt: '1b8181d06caa8f6c0bac',
  126 |             verifier: 'test-verifier-hex',
  127 |             iterations: 600000
  128 |           },
  129 |           entries: [
  130 |             {
  131 |               type: 'course',
  132 |               date: todayDate,
  133 |               filename: `course-${todayDate}.json`,
  134 |               sha256: 'test-sha'
  135 |             }
  136 |           ]
  137 |         })
  138 |       });
  139 |     });
  140 | 
  141 |     // Initialize vault (already on settings page from beforeEach)
  142 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  143 |     await page.waitForTimeout(200);
  144 |     await page.locator('#password').fill(testPassword);
  145 |     await page.locator('#confirm-password').fill(testPassword);
  146 |     await page.getByRole('button', { name: '确认初始化' }).click();
  147 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  148 | 
  149 |     // Navigate to learning
  150 |     await page.click('a[href="#/learning"]');
  151 |     await page.waitForURL(/.*#\/learning$/);
  152 | 
  153 |     // Should handle published course loading even if structure varies
  154 |     // The actualData = courseData.content || courseData line handles both
  155 |     const hasCourses = await page.locator('.learning-card').isVisible().catch(() => false);
  156 |     expect(hasCourses !== undefined).toBe(true);
  157 |   });
  158 | 
  159 |   test('should show UnlockPrompt when accessing locked course detail directly', async ({ page }) => {
  160 |     // Simulate accessing /#/learning/2026-11-17 directly without unlock
  161 |     await page.goto(`/#/learning/${todayDate}`);
```