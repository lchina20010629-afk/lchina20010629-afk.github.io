# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: courses.spec.ts >> Course/Learning Features >> should not allow editing published courses
- Location: e2e/courses.spec.ts:158:3

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  locator('.completion-toggle').first()
Expected: disabled
Received: enabled
Timeout:  5000ms

Call log:
  - Expect "toBeDisabled" locator('.completion-toggle').first() with timeout 5000ms
  - waiting for locator('.completion-toggle').first()
    14 × locator resolved to <button title="" class="completion-toggle">…</button>
       - unexpected value "enabled"

```

```yaml
- button "未完成":
  - img
  - text: 未完成
```

# Test source

```ts
  63  |     
  64  |     // Check reflections
  65  |     await expect(page.locator('text=Learned new idioms')).toBeVisible();
  66  |     await expect(page.locator('text=Supply chain strategy insights')).toBeVisible();
  67  |     
  68  |     // Check summary stats
  69  |     await expect(page.locator('text=30分钟')).toBeVisible(); // total minutes
  70  |     await expect(page.locator('text=100%')).toBeVisible(); // completion rate
  71  |   });
  72  | 
  73  |   test('should track explicit completion toggles locally', async ({ page }) => {
  74  |     const today = new Date().toISOString().split('T')[0];
  75  |     await page.goto(`/#/learning/${today}`);
  76  |     await page.waitForTimeout(1000);
  77  |     
  78  |     // Wait for page to load - should show course columns with Chinese labels
  79  |     await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
  80  |     await expect(page.locator('text=泰语')).toBeVisible();
  81  |     
  82  |     // All courses start uncompleted - verify first toggle shows 未完成
  83  |     await expect(page.locator('.completion-toggle').first().locator('text=未完成')).toBeVisible({ timeout: 5000 });
  84  |     
  85  |     // Toggle completion
  86  |     await page.locator('.completion-toggle').first().click();
  87  |     await page.waitForTimeout(1000); // Wait for save
  88  |     
  89  |     // Re-query DOM after state update - should now show 已完成
  90  |     await expect(page.locator('.completion-toggle').first().locator('text=已完成')).toBeVisible({ timeout: 5000 });
  91  |     
  92  |     // Lock and reload - vault password is memory-only, so need to unlock again
  93  |     await page.goto('/#/settings');
  94  |     await page.locator('button:has-text("锁定")').click();
  95  |     await page.waitForTimeout(500);
  96  |     
  97  |     // Unlock again
  98  |     await page.getByRole('button', { name: '解锁' }).first().click();
  99  |     await page.waitForTimeout(200);
  100 |     await page.locator('#unlock-password').fill(TEST_PASSWORD);
  101 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  102 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  103 |     
  104 |     // Navigate back - should persist
  105 |     await page.goto(`/#/learning/${today}`);
  106 |     await page.waitForTimeout(1000);
  107 |     await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
  108 |     await expect(page.locator('.completion-toggle').first().locator('text=已完成')).toBeVisible({ timeout: 5000 });
  109 |   });
  110 | 
  111 |   test('should store and display reflection locally', async ({ page }) => {
  112 |     const today = new Date().toISOString().split('T')[0];
  113 |     await page.goto(`/#/learning/${today}`);
  114 |     await page.waitForTimeout(1000);
  115 |     
  116 |     // Wait for page to load
  117 |     await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
  118 |     
  119 |     // Enter reflection in first column (auto-saves on change)
  120 |     const textarea = page.locator('textarea').first();
  121 |     await expect(textarea).toBeVisible({ timeout: 5000 });
  122 |     await textarea.fill('今天语法学习进步很大！');
  123 |     await page.waitForTimeout(1000); // Wait for auto-save
  124 |     
  125 |     // Lock and unlock to verify persistence
  126 |     await page.goto('/#/settings');
  127 |     await page.locator('button:has-text("锁定")').click();
  128 |     await page.waitForTimeout(500);
  129 |     
  130 |     // Unlock
  131 |     await page.getByRole('button', { name: '解锁' }).first().click();
  132 |     await page.waitForTimeout(200);
  133 |     await page.locator('#unlock-password').fill(TEST_PASSWORD);
  134 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  135 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  136 |     
  137 |     // Navigate back - should persist
  138 |     await page.goto(`/#/learning/${today}`);
  139 |     await page.waitForTimeout(1000);
  140 |     await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
  141 |     await expect(page.locator('textarea').first()).toHaveValue('今天语法学习进步很大！', { timeout: 10000 });
  142 |   });
  143 | 
  144 |   test('should clear course data on lock', async ({ page }) => {
  145 |     await page.goto('/#/learning/2024-03-16');
  146 |     await expect(page.locator('text=TED Talk')).toBeVisible();
  147 |     
  148 |     // Lock
  149 |     await page.goto('/#/settings');
  150 |     await page.locator('button:has-text("锁定")').click();
  151 |     
  152 |     // Navigate back - should show locked message
  153 |     await page.goto('/#/learning/2024-03-16');
  154 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible();
  155 |     await expect(page.locator('text=TED Talk')).not.toBeVisible();
  156 |   });
  157 | 
  158 |   test('should not allow editing published courses', async ({ page }) => {
  159 |     await page.goto('/#/learning/2024-03-16');
  160 |     
  161 |     // Completion toggle should be disabled
  162 |     const toggle = page.locator('.completion-toggle').first();
> 163 |     await expect(toggle).toBeDisabled();
      |                          ^ Error: expect(locator).toBeDisabled() failed
  164 |     
  165 |     // Reflection fields should not exist (published uses <p> not <textarea>)
  166 |     await expect(page.locator('textarea')).not.toBeVisible();
  167 |   });
  168 | 
  169 |   test('should reject wrong password on unlock', async ({ page }) => {
  170 |     await page.goto('/#/settings');
  171 |     await page.waitForTimeout(200);
  172 |     await page.locator('button:has-text("锁定")').click();
  173 |     await page.waitForTimeout(500);
  174 |     
  175 |     // Try wrong password - click unlock button to show form
  176 |     await page.getByRole('button', { name: '解锁' }).first().click();
  177 |     await page.waitForTimeout(200);
  178 |     await page.locator('#unlock-password').fill('WrongPassword');
  179 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  180 |     
  181 |     await expect(page.locator('text=密码错误')).toBeVisible({ timeout: 5000 });
  182 |     
  183 |     // Courses should remain locked
  184 |     await page.goto('/#/learning');
  185 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  186 |   });
  187 | 
  188 |   test('should capture screenshots of course detail with feedback', async ({ page }) => {
  189 |     // Navigate to published course with feedback
  190 |     await page.goto('/#/learning/2024-03-16');
  191 |     await page.waitForTimeout(1000);
  192 |     
  193 |     // Wait for content to load
  194 |     await expect(page.locator('text=英语')).toBeVisible({ timeout: 10000 });
  195 |     await expect(page.locator('text=TED Talk')).toBeVisible();
  196 |     
  197 |     // Verify all 4 columns are present
  198 |     await expect(page.locator('text=泰语')).toBeVisible();
  199 |     await expect(page.locator('text=修身养性')).toBeVisible();
  200 |     await expect(page.locator('text=生财有道')).toBeVisible();
  201 |     
  202 |     // Desktop screenshot
  203 |     await page.setViewportSize({ width: 1920, height: 1080 });
  204 |     await page.waitForTimeout(500);
  205 |     await page.screenshot({ path: '/opt/cursor/artifacts/course-detail-desktop.png', fullPage: true });
  206 |     
  207 |     // Mobile screenshots - normal viewport at top and scrolled position
  208 |     await page.setViewportSize({ width: 375, height: 812 });
  209 |     await page.waitForTimeout(500);
  210 |     
  211 |     // Scroll to top first
  212 |     await page.evaluate(() => window.scrollTo(0, 0));
  213 |     await page.waitForTimeout(300);
  214 |     
  215 |     // Verify first cards visible at top (英语 should be visible, 生财有道 should be below fold)
  216 |     await expect(page.locator('.course-column').filter({ hasText: '英语' })).toBeVisible();
  217 |     
  218 |     // Screenshot top viewport (showing 英语, 泰语)
  219 |     await page.screenshot({ path: '/opt/cursor/artifacts/course-detail-mobile-top.png' });
  220 |     
  221 |     // Scroll down to show bottom cards
  222 |     await page.evaluate(() => {
  223 |       const columns = document.querySelectorAll('.course-column');
  224 |       if (columns.length >= 4) {
  225 |         columns[3].scrollIntoView({ behavior: 'smooth', block: 'center' });
  226 |       }
  227 |     });
  228 |     await page.waitForTimeout(500);
  229 |     
  230 |     // Verify bottom cards visible after scroll (生财有道, 修身养性)
  231 |     const shengcaiCard = page.locator('.course-column').filter({ hasText: '生财有道' });
  232 |     await expect(shengcaiCard).toBeVisible();
  233 |     
  234 |     // Screenshot bottom viewport (showing 修身养性, 生财有道, 今日总结)
  235 |     await page.screenshot({ path: '/opt/cursor/artifacts/course-detail-mobile-bottom.png' });
  236 |   });
  237 | });
  238 | 
```