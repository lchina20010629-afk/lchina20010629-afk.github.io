# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should preserve course detail state after unlock from prompt
- Location: e2e/course-click.spec.ts:177:3

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
  91  |     await page.reload();
  92  |     await page.waitForLoadState('networkidle');
  93  | 
  94  |     // Step 7: Verify UnlockPrompt appears (not just text message)
  95  |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  96  |     await expect(page.locator('input#unlock-password')).toBeVisible();
  97  |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  98  | 
  99  |     // Step 8: Unlock with password
  100 |     await page.fill('input#unlock-password', testPassword);
  101 |     await page.click('button:has-text("解锁")');
  102 | 
  103 |     // Step 9: Verify detail content is accessible again
  104 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  105 |     expect(await page.locator('.course-column').count()).toBe(4);
  106 | 
  107 |     // Verify content sections are present (materials, exercises, reflection)
  108 |     // Even with totalMinutes=0, columns should be clickable and show structure
  109 |     const firstColumn = page.locator('.course-column').first();
  110 |     await expect(firstColumn.locator('.column-header')).toBeVisible();
  111 |     await expect(firstColumn.locator('.completion-toggle')).toBeVisible();
  112 |   });
  113 | 
  114 |   test('should handle published course with wrapped content structure', async ({ page }) => {
  115 |     // This test validates the dual structure support:
  116 |     // 1. Root: {courses: [...], totalMinutes, notes}
  117 |     // 2. Wrapped: {content: {courses: [...], totalMinutes, notes}}
  118 | 
  119 |     // Mock published manifest with wrapped structure
  120 |     await page.route('**/data/manifest.json', async route => {
  121 |       await route.fulfill({
  122 |         status: 200,
  123 |         contentType: 'application/json',
  124 |         body: JSON.stringify({
  125 |           verifier: {
  126 |             salt: '1b8181d06caa8f6c0bac',
  127 |             verifier: 'test-verifier-hex',
  128 |             iterations: 600000
  129 |           },
  130 |           entries: [
  131 |             {
  132 |               type: 'course',
  133 |               date: todayDate,
  134 |               filename: `course-${todayDate}.json`,
  135 |               sha256: 'test-sha'
  136 |             }
  137 |           ]
  138 |         })
  139 |       });
  140 |     });
  141 | 
  142 |     // Initialize vault (already on settings page from beforeEach)
  143 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  144 |     await page.waitForTimeout(200);
  145 |     await page.locator('#password').fill(testPassword);
  146 |     await page.locator('#confirm-password').fill(testPassword);
  147 |     await page.getByRole('button', { name: '确认初始化' }).click();
  148 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  149 | 
  150 |     // Navigate to learning
  151 |     await page.click('a[href="#/learning"]');
  152 |     await page.waitForURL(/.*#\/learning$/);
  153 | 
  154 |     // Should handle published course loading even if structure varies
  155 |     // The actualData = courseData.content || courseData line handles both
  156 |     const hasCourses = await page.locator('.learning-card').isVisible().catch(() => false);
  157 |     expect(hasCourses !== undefined).toBe(true);
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
  178 |     // Initialize vault first (already on settings page from beforeEach)
  179 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  180 |     await page.waitForTimeout(200);
  181 |     await page.locator('#password').fill(testPassword);
  182 |     await page.locator('#confirm-password').fill(testPassword);
  183 |     await page.getByRole('button', { name: '确认初始化' }).click();
  184 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  185 | 
  186 |     // Navigate to course detail
  187 |     await page.goto(`/#/learning/${todayDate}`);
  188 |     await page.waitForLoadState('networkidle');
  189 |     
  190 |     // Verify loaded
> 191 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  192 |     
  193 |     // Refresh to lock
  194 |     await page.reload();
  195 |     await page.waitForLoadState('networkidle');
  196 | 
  197 |     // Unlock via prompt
  198 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  199 |     await page.fill('input#unlock-password', testPassword);
  200 |     await page.click('button:has-text("解锁")');
  201 | 
  202 |     // Should reload same page with content
  203 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  204 |     expect(await page.url()).toContain(`/learning/${todayDate}`);
  205 |   });
  206 | });
  207 | 
```