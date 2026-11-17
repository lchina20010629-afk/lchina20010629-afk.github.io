# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-click.spec.ts >> Course Click and Detail Flow >> should preserve course detail state after unlock from prompt
- Location: e2e/course-click.spec.ts:176:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('保险库已解锁')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('保险库已解锁') with timeout 5000ms
  - waiting for getByText('保险库已解锁')

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
  - heading "设置" [level=1]
  - paragraph: 管理您的个人数据和偏好
  - heading "🔒 保险库状态" [level=2]
  - heading "初始化保险库" [level=3]
  - paragraph: 请设置一个强密码来保护您的数据
  - text: 主密码
  - textbox "主密码":
    - /placeholder: 至少16个字符，包含大小写字母、数字和特殊字符
    - text: test-course-password-123
  - paragraph: "建议包含大写字母；避免使用常见模式: 123"
  - text: 确认密码
  - textbox "确认密码":
    - /placeholder: 再次输入密码
    - text: test-course-password-123
  - img
  - text: "密码强度不足：建议包含大写字母；避免使用常见模式: 123"
  - img
  - strong: 重要提示：
  - list:
    - listitem:
      - text: 密码一旦忘记
      - strong: 无法恢复
    - listitem: 请务必记住或安全保存您的密码
    - listitem: 建议定期导出加密备份
  - button "取消"
  - button "确认初始化"
  - heading "🎨 外观设置" [level=2]
  - heading "主题模式" [level=3]
  - button "浅色":
    - img
    - text: 浅色
  - button "深色":
    - img
    - text: 深色
  - button "跟随系统":
    - img
    - text: 跟随系统
  - heading "调色板" [level=3]
  - paragraph: 选择您喜欢的配色方案
  - button "米白墨绿":
    - text: 米白墨绿
    - img
  - button "清爽蓝"
  - button "暖杏"
  - button "淡紫"
  - heading "ℹ️ 隐私与安全说明" [level=2]
  - list:
    - listitem: ✅ 所有个人数据使用 AES-256-GCM 加密
    - listitem: ✅ 密钥派生使用 PBKDF2-SHA256 (600,000 次迭代)
    - listitem: ✅ 数据仅保存在当前浏览器的 IndexedDB 中
    - listitem: ⚠️ 公开的 GitHub 仓库仅包含加密后的密文
    - listitem: ⚠️ 弱密码可能被离线暴力破解，请使用强密码
    - listitem: ⚠️ 浏览器清除数据会导致本地内容丢失
    - listitem: 📦 建议定期导出加密备份到安全位置
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
  162 |     await page.waitForLoadState('networkidle');
  163 | 
  164 |     // Should show UnlockPrompt, not just text
  165 |     await expect(page.locator('text=保险库已锁定')).toBeVisible({ timeout: 3000 });
  166 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  167 |     await expect(page.locator('button:has-text("解锁")')).toBeVisible();
  168 | 
  169 |     // Should have back button visible
  170 |     await expect(page.locator('a.back-button')).toBeVisible();
  171 |     
  172 |     // Should have explanatory text
  173 |     await expect(page.locator('text=页面刷新后需要重新输入密码')).toBeVisible();
  174 |   });
  175 | 
  176 |   test('should preserve course detail state after unlock from prompt', async ({ page }) => {
  177 |     // Initialize vault first (already on settings page from beforeEach)
  178 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  179 |     await page.waitForTimeout(200);
  180 |     await page.locator('#password').fill(testPassword);
  181 |     await page.locator('#confirm-password').fill(testPassword);
  182 |     await page.getByRole('button', { name: '确认初始化' }).click();
> 183 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
      |                                            ^ Error: expect(locator).toBeVisible() failed
  184 | 
  185 |     // Navigate to course detail
  186 |     await page.goto(`/#/learning/${todayDate}`);
  187 |     await page.waitForLoadState('networkidle');
  188 |     
  189 |     // Verify loaded
  190 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  191 |     
  192 |     // Refresh to lock
  193 |     await page.reload();
  194 |     await page.waitForLoadState('networkidle');
  195 | 
  196 |     // Unlock via prompt
  197 |     await expect(page.locator('input#unlock-password')).toBeVisible();
  198 |     await page.fill('input#unlock-password', testPassword);
  199 |     await page.click('button:has-text("解锁")');
  200 | 
  201 |     // Should reload same page with content
  202 |     await expect(page.locator('.course-columns')).toBeVisible({ timeout: 5000 });
  203 |     expect(await page.url()).toContain(`/learning/${todayDate}`);
  204 |   });
  205 | });
  206 | 
```