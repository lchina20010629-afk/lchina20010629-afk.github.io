# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: courses.spec.ts >> Course/Learning Features >> should track explicit completion toggles locally
- Location: e2e/courses.spec.ts:69:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=English')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=English') with timeout 10000ms
  - waiting for locator('text=English')

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
  - link:
    - /url: "#/learning/2026-11-16#/learning"
    - img
  - heading "学习记录 - 2026-11-16" [level=1]
  - heading "英语" [level=3]
  - text: "目标: 10分钟"
  - button "未完成":
    - img
    - text: 未完成
  - heading "学习反思" [level=4]
  - textbox "记录今天的学习心得..."
  - heading "泰语" [level=3]
  - text: "目标: 8分钟"
  - button "未完成":
    - img
    - text: 未完成
  - heading "学习反思" [level=4]
  - textbox "记录今天的学习心得..."
  - heading "修身养性" [level=3]
  - text: "目标: 6分钟"
  - button "未完成":
    - img
    - text: 未完成
  - heading "学习反思" [level=4]
  - textbox "记录今天的学习心得..."
  - heading "生财有道" [level=3]
  - text: "目标: 6分钟"
  - button "未完成":
    - img
    - text: 未完成
  - heading "学习反思" [level=4]
  - textbox "记录今天的学习心得..."
  - heading "今日总结" [level=3]
  - text: "总学习时长:"
  - strong: 0分钟
  - text: "完成率:"
  - strong: 0%
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { promises as fs } from 'fs';
  3   | import { join } from 'path';
  4   | 
  5   | const TEST_PASSWORD = 'TestPass123!';
  6   | const FIXTURES_DIR = '/tmp/test-course-fixtures';
  7   | 
  8   | test.describe('Course/Learning Features', () => {
  9   |   test.beforeEach(async ({ page, context }) => {
  10  |     // Clear browser state only
  11  |     await context.clearCookies();
  12  |     await page.goto('/#/settings');
  13  |     await page.evaluate(async () => {
  14  |       const dbs = await indexedDB.databases();
  15  |       for (const db of dbs) {
  16  |         if (db.name) {
  17  |           indexedDB.deleteDatabase(db.name);
  18  |         }
  19  |       }
  20  |       localStorage.clear();
  21  |       sessionStorage.clear();
  22  |     });
  23  |     await page.reload();
  24  |     
  25  |     // Init vault - click button to show form
  26  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  27  |     await page.waitForTimeout(200);
  28  |     await page.locator('#password').fill(TEST_PASSWORD);
  29  |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  30  |     await page.getByRole('button', { name: '确认初始化' }).click();
  31  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  32  |   });
  33  | 
  34  |   test('should load and display published courses', async ({ page }) => {
  35  |     await page.goto('/#/learning');
  36  |     
  37  |     // Should see course entries
  38  |     await expect(page.locator('text=2024-03-15')).toBeVisible();
  39  |     await expect(page.locator('text=2024-03-16')).toBeVisible();
  40  |     
  41  |     // Both should show published badge
  42  |     await expect(page.locator('.published-badge').first()).toBeVisible();
  43  |   });
  44  | 
  45  |   test('should render course detail with 4 columns', async ({ page }) => {
  46  |     await page.goto('/#/learning/2024-03-16');
  47  |     
  48  |     // Check all 4 column headers
  49  |     await expect(page.locator('text=英语')).toBeVisible();
  50  |     await expect(page.locator('text=泰语')).toBeVisible();
  51  |     await expect(page.locator('text=修身养性')).toBeVisible();
  52  |     await expect(page.locator('text=生财有道')).toBeVisible();
  53  |     
  54  |     // Check materials
  55  |     await expect(page.locator('text=TED Talk: The power of words')).toBeVisible();
  56  |     await expect(page.locator('text=Thai script practice')).toBeVisible();
  57  |     await expect(page.locator('text=道德经 第一章')).toBeVisible();
  58  |     await expect(page.locator('text=Tesla vertical integration case')).toBeVisible();
  59  |     
  60  |     // Check reflections
  61  |     await expect(page.locator('text=Learned new idioms')).toBeVisible();
  62  |     await expect(page.locator('text=Supply chain strategy insights')).toBeVisible();
  63  |     
  64  |     // Check summary stats
  65  |     await expect(page.locator('text=30分钟')).toBeVisible(); // total minutes
  66  |     await expect(page.locator('text=100%')).toBeVisible(); // completion rate
  67  |   });
  68  | 
  69  |   test('should track explicit completion toggles locally', async ({ page }) => {
  70  |     const today = new Date().toISOString().split('T')[0];
  71  |     await page.goto(`/#/learning/${today}`);
  72  |     await page.waitForTimeout(1000);
  73  |     
  74  |     // Wait for page to load - should show course columns
> 75  |     await expect(page.locator('text=English')).toBeVisible({ timeout: 10000 });
      |                                                ^ Error: expect(locator).toBeVisible() failed
  76  |     
  77  |     // All courses start uncompleted - look for checkboxes or toggle buttons
  78  |     const firstToggle = page.locator('.completion-toggle').first();
  79  |     await expect(firstToggle).toBeVisible({ timeout: 5000 });
  80  |     
  81  |     // Toggle completion
  82  |     await firstToggle.click();
  83  |     await page.waitForTimeout(500);
  84  |     
  85  |     // Reload page - should persist
  86  |     await page.reload();
  87  |     await page.waitForTimeout(1000);
  88  |     // Just verify the toggle is still there and clickable
  89  |     await expect(firstToggle).toBeVisible({ timeout: 10000 });
  90  |   });
  91  | 
  92  |   test('should store and display reflection locally', async ({ page }) => {
  93  |     const today = new Date().toISOString().split('T')[0];
  94  |     await page.goto(`/#/learning/${today}`);
  95  |     await page.waitForTimeout(1000);
  96  |     
  97  |     // Wait for page to load
  98  |     await expect(page.locator('text=English')).toBeVisible({ timeout: 10000 });
  99  |     
  100 |     // Enter reflection in first column
  101 |     const textarea = page.locator('textarea').first();
  102 |     await expect(textarea).toBeVisible({ timeout: 5000 });
  103 |     await textarea.fill('Great progress on grammar today!');
  104 |     await page.waitForTimeout(1000); // Wait for auto-save
  105 |     
  106 |     // Reload - should persist
  107 |     await page.reload();
  108 |     await page.waitForTimeout(1000);
  109 |     await expect(page.locator('textarea').first()).toHaveValue('Great progress on grammar today!', { timeout: 10000 });
  110 |   });
  111 | 
  112 |   test('should clear course data on lock', async ({ page }) => {
  113 |     await page.goto('/#/learning/2024-03-16');
  114 |     await expect(page.locator('text=TED Talk')).toBeVisible();
  115 |     
  116 |     // Lock
  117 |     await page.goto('/#/settings');
  118 |     await page.locator('button:has-text("锁定")').click();
  119 |     
  120 |     // Navigate back - should show locked message
  121 |     await page.goto('/#/learning/2024-03-16');
  122 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible();
  123 |     await expect(page.locator('text=TED Talk')).not.toBeVisible();
  124 |   });
  125 | 
  126 |   test('should not allow editing published courses', async ({ page }) => {
  127 |     await page.goto('/#/learning/2024-03-16');
  128 |     
  129 |     // Completion toggle should be disabled
  130 |     const toggle = page.locator('.completion-toggle').first();
  131 |     await expect(toggle).toBeDisabled();
  132 |     
  133 |     // Reflection fields should not exist (published uses <p> not <textarea>)
  134 |     await expect(page.locator('textarea')).not.toBeVisible();
  135 |   });
  136 | 
  137 |   test('should reject wrong password on unlock', async ({ page }) => {
  138 |     await page.goto('/#/settings');
  139 |     await page.waitForTimeout(200);
  140 |     await page.locator('button:has-text("锁定")').click();
  141 |     await page.waitForTimeout(500);
  142 |     
  143 |     // Try wrong password - click unlock button to show form
  144 |     await page.getByRole('button', { name: '解锁' }).first().click();
  145 |     await page.waitForTimeout(200);
  146 |     await page.locator('#unlock-password').fill('WrongPassword');
  147 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  148 |     
  149 |     await expect(page.locator('text=密码错误')).toBeVisible({ timeout: 5000 });
  150 |     
  151 |     // Courses should remain locked
  152 |     await page.goto('/#/learning');
  153 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  154 |   });
  155 | });
  156 | 
```