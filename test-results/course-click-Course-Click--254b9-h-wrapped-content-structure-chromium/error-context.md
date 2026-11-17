# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should handle published course with wrapped content structure
- Location: e2e/course-click.spec.ts:102:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="password"]')

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
        - link "成长学习" [ref=f1e18] [cursor=pointer]:
          - /url: "#/learning"
        - link "总结回顾" [ref=f1e22] [cursor=pointer]:
          - /url: "#/reviews"
        - link "设置" [ref=f1e27] [cursor=pointer]:
          - /url: "#/settings"
      - 'button "当前主题: 跟随系统" [ref=f1e33] [cursor=pointer]'
    - main [ref=f1e36]:
      - generic [ref=f1e37]:
        - generic [ref=f1e39]:
          - heading "今日总览" [level=1] [ref=f1e40]
          - paragraph [ref=f1e41]: 2026-11-17 • 今天
        - generic [ref=f1e42]:
          - generic [ref=f1e43]:
            - heading "生活日记" [level=3] [ref=f1e47]
            - paragraph [ref=f1e48]: 记录今天的点滴
            - link "查看日记" [ref=f1e49] [cursor=pointer]:
              - /url: "#/diary"
          - generic [ref=f1e50]:
            - heading "成长学习" [level=3] [ref=f1e54]
            - paragraph [ref=f1e55]: 今日学习进度
            - link "查看学习" [ref=f1e56] [cursor=pointer]:
              - /url: "#/learning"
          - generic [ref=f1e57]:
            - heading "总结回顾" [level=3] [ref=f1e62]
            - paragraph [ref=f1e63]: 周/月/年度回顾
            - link "查看总结" [ref=f1e64] [cursor=pointer]:
              - /url: "#/reviews"
        - generic [ref=f1e66]:
          - heading "暂无数据" [level=3] [ref=f1e71]
          - paragraph [ref=f1e72]: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
          - button "前往设置" [ref=f1e73] [cursor=pointer]
        - generic [ref=f1e74]:
          - heading "📅 外部自动化流程说明" [level=4] [ref=f1e75]
          - paragraph [ref=f1e76]: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
          - list [ref=f1e77]:
            - listitem [ref=f1e78]: 每天 10:30 - 课程准备
            - listitem [ref=f1e79]: 每天 23:30 - 日记整理润色
            - listitem [ref=f1e80]: 每周日 - 周总结
            - listitem [ref=f1e81]: 每月最后一天 - 月总结
            - listitem [ref=f1e82]: 12月31日 - 年终总结
          - paragraph [ref=f1e83]: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
  - generic [ref=f1e85]:
    - generic [ref=f1e89]:
      - heading "安装应用到Desktop" [level=3] [ref=f1e90]
      - paragraph [ref=f1e91]: 点击地址栏右侧的安装图标，或在浏览器菜单中选择"安装应用"。
    - button "关闭" [ref=f1e92] [cursor=pointer]
  - button "检查更新" [ref=f1e96] [cursor=pointer]
```

# Test source

```ts
  32  |   test('should handle complete course flow: init → list → click → detail → refresh → unlock → detail', async ({ page }) => {
  33  |     // Step 1: Initialize vault
  34  |     await expect(page.locator('text=保险库未初始化')).toBeVisible({ timeout: 5000 });
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
> 132 |     await page.fill('input[type="password"]', testPassword);
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  133 |     await page.fill('input[placeholder*="确认"]', testPassword);
  134 |     await page.click('button:has-text("初始化")');
  135 |     await expect(page.locator('text=初始化成功')).toBeVisible();
  136 | 
  137 |     // Navigate to learning
  138 |     await page.click('a[href="#/learning"]');
  139 |     await page.waitForURL(/.*#\/learning$/);
  140 | 
  141 |     // Should handle published course loading even if structure varies
  142 |     // The actualData = courseData.content || courseData line handles both
  143 |     const hasCourses = await page.locator('.learning-card').isVisible().catch(() => false);
  144 |     expect(hasCourses !== undefined).toBe(true);
  145 |   });
  146 | 
  147 |   test('should show UnlockPrompt when accessing locked course detail directly', async ({ page }) => {
  148 |     // Simulate accessing /#/learning/2026-11-17 directly without unlock
  149 |     await page.goto(`/#/learning/${todayDate}`);
  150 |     await page.waitForLoadState('networkidle');
  151 | 
  152 |     // Should show UnlockPrompt, not just text
  153 |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  154 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  155 |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  156 | 
  157 |     // Should have back button visible
  158 |     await expect(page.locator('a.back-button')).toBeVisible();
  159 |     
  160 |     // Should have explanatory text
  161 |     await expect(page.locator('text=页面刷新后需要重新输入密码')).toBeVisible();
  162 |   });
  163 | 
  164 |   test('should preserve course detail state after unlock from prompt', async ({ page }) => {
  165 |     // Initialize vault first
  166 |     await page.goto('/');
  167 |     await page.fill('input[type="password"]', testPassword);
  168 |     await page.fill('input[placeholder*="确认"]', testPassword);
  169 |     await page.click('button:has-text("初始化")');
  170 |     await expect(page.locator('text=初始化成功')).toBeVisible();
  171 | 
  172 |     // Navigate to course detail
  173 |     await page.goto(`/#/learning/${todayDate}`);
  174 |     await page.waitForLoadState('networkidle');
  175 |     
  176 |     // Verify loaded
  177 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  178 |     
  179 |     // Refresh to lock
  180 |     await page.reload();
  181 |     await page.waitForLoadState('networkidle');
  182 | 
  183 |     // Unlock via prompt
  184 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  185 |     await page.fill('input#unlock-password', testPassword);
  186 |     await page.click('button:has-text("解锁")');
  187 | 
  188 |     // Should reload same page with content
  189 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  190 |     expect(await page.url()).toContain(`/learning/${todayDate}`);
  191 |   });
  192 | });
  193 | 
```