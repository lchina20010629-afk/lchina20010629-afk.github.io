# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should handle complete course flow: init → list → click → detail → refresh → unlock → detail
- Location: e2e/course-click.spec.ts:32:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=保险库未初始化')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=保险库未初始化') with timeout 5000ms
  - waiting for locator('text=保险库未初始化')

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
  - heading "今日总览" [level=1]
  - paragraph: 2026-11-17 • 今天
  - img
  - heading "生活日记" [level=3]
  - paragraph: 记录今天的点滴
  - link "查看日记":
    - /url: "#/diary"
  - img
  - heading "成长学习" [level=3]
  - paragraph: 今日学习进度
  - link "查看学习":
    - /url: "#/learning"
  - img
  - heading "总结回顾" [level=3]
  - paragraph: 周/月/年度回顾
  - link "查看总结":
    - /url: "#/reviews"
  - img
  - heading "暂无数据" [level=3]
  - paragraph: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
  - button "前往设置"
  - heading "📅 外部自动化流程说明" [level=4]
  - paragraph: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
  - list:
    - listitem: 每天 10:30 - 课程准备
    - listitem: 每天 23:30 - 日记整理润色
    - listitem: 每周日 - 周总结
    - listitem: 每月最后一天 - 月总结
    - listitem: 12月31日 - 年终总结
  - paragraph: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
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
  24  |   const testPassword = 'test-course-password-123';
  25  |   const todayDate = getTodayDate();
  26  | 
  27  |   test.beforeEach(async ({ page }) => {
  28  |     await page.goto('/');
  29  |     await page.waitForLoadState('networkidle');
  30  |   });
  31  | 
  32  |   test('should handle complete course flow: init → list → click → detail → refresh → unlock → detail', async ({ page }) => {
  33  |     // Step 1: Initialize vault
> 34  |     await expect(page.locator('text=保险库未初始化')).toBeVisible({ timeout: 5000 });
      |                                                ^ Error: expect(locator).toBeVisible() failed
  35  |     await page.fill('input[type="password"]', testPassword);
  36  |     await page.fill('input[placeholder*="确认"]', testPassword);
  37  |     await page.click('button:has-text("初始化")');
  38  |     
  39  |     await expect(page.locator('text=初始化成功')).toBeVisible({ timeout: 3000 });
  40  |     await page.waitForTimeout(500);
  41  | 
  42  |     // Step 2: Navigate to Learning page
  43  |     await page.click('a[href="#/learning"]');
  44  |     await page.waitForURL(/.*#\/learning$/);
  45  | 
  46  |     // Step 3: Verify course list loads (or empty state appears)
  47  |     const hasCourses = await page.locator('.learning-card').count() > 0;
  48  |     const hasEmptyState = await page.locator('text=暂无学习记录').isVisible().catch(() => false);
  49  |     
  50  |     expect(hasCourses || hasEmptyState).toBe(true);
  51  | 
  52  |     // Step 4: Create or navigate to today's course
  53  |     if (!hasCourses) {
  54  |       await page.click('button:has-text("创建今日记录")');
  55  |     } else {
  56  |       // Click the first course card (should be today's if published)
  57  |       await page.click('.learning-card');
  58  |     }
  59  | 
  60  |     // Step 5: Verify detail page loads with 4 columns
  61  |     await page.waitForURL(/.*#\/learning\/.+/);
  62  |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  63  |     
  64  |     const columnCount = await page.locator('.course-column').count();
  65  |     expect(columnCount).toBe(4);
  66  | 
  67  |     // Verify column headers show target minutes
  68  |     const columns = ['english', 'thai', 'character', 'wealth'];
  69  |     for (const col of columns) {
  70  |       const columnSelector = `.course-column:has(h3:has-text("${col === 'english' ? 'English' : col === 'thai' ? 'ไทย' : col === 'character' ? '修身养性' : '生财有道'}"))`;
  71  |       await expect(page.locator(columnSelector)).toBeVisible();
  72  |     }
  73  | 
  74  |     // Verify course structure fields are accessible
  75  |     await expect(page.locator('.completion-toggle')).toHaveCount(4);
  76  |     await expect(page.locator('.target-time').first()).toBeVisible();
  77  | 
  78  |     // Step 6: Refresh page (locks vault)
  79  |     await page.reload();
  80  |     await page.waitForLoadState('networkidle');
  81  | 
  82  |     // Step 7: Verify UnlockPrompt appears (not just text message)
  83  |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  84  |     await expect(page.locator('input#unlock-password')).toBeVisible();
  85  |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  86  | 
  87  |     // Step 8: Unlock with password
  88  |     await page.fill('input#unlock-password', testPassword);
  89  |     await page.click('button:has-text("解锁")');
  90  | 
  91  |     // Step 9: Verify detail content is accessible again
  92  |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  93  |     expect(await page.locator('.course-column').count()).toBe(4);
  94  | 
  95  |     // Verify content sections are present (materials, exercises, reflection)
  96  |     // Even with totalMinutes=0, columns should be clickable and show structure
  97  |     const firstColumn = page.locator('.course-column').first();
  98  |     await expect(firstColumn.locator('.column-header')).toBeVisible();
  99  |     await expect(firstColumn.locator('.completion-toggle')).toBeVisible();
  100 |   });
  101 | 
  102 |   test('should handle published course with wrapped content structure', async ({ page }) => {
  103 |     // This test validates the dual structure support:
  104 |     // 1. Root: {courses: [...], totalMinutes, notes}
  105 |     // 2. Wrapped: {content: {courses: [...], totalMinutes, notes}}
  106 | 
  107 |     // Mock published manifest with wrapped structure
  108 |     await page.route('**/data/manifest.json', async route => {
  109 |       await route.fulfill({
  110 |         status: 200,
  111 |         contentType: 'application/json',
  112 |         body: JSON.stringify({
  113 |           verifier: {
  114 |             salt: '1b8181d06caa8f6c0bac',
  115 |             verifier: 'test-verifier-hex',
  116 |             iterations: 600000
  117 |           },
  118 |           entries: [
  119 |             {
  120 |               type: 'course',
  121 |               date: todayDate,
  122 |               filename: `course-${todayDate}.json`,
  123 |               sha256: 'test-sha'
  124 |             }
  125 |           ]
  126 |         })
  127 |       });
  128 |     });
  129 | 
  130 |     // Initialize vault
  131 |     await page.goto('/');
  132 |     await page.fill('input[type="password"]', testPassword);
  133 |     await page.fill('input[placeholder*="确认"]', testPassword);
  134 |     await page.click('button:has-text("初始化")');
```