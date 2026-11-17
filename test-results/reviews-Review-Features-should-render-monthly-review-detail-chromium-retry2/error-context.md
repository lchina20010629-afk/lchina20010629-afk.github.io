# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reviews.spec.ts >> Review Features >> should render monthly review detail
- Location: e2e/reviews.spec.ts:67:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('input#title')
Expected: "三月总结"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" locator('input#title') with timeout 5000ms
  - waiting for locator('input#title')
    14 × locator resolved to <input value="" id="title" type="text" placeholder="2024-03 月总结"/>
       - unexpected value ""

```

```yaml
- textbox "标题":
  - /placeholder: 2024-03 月总结
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
  8   | test.describe('Review Features', () => {
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
  34  |   test('should load and display published reviews', async ({ page }) => {
  35  |     await page.goto('/#/reviews');
  36  |     await page.waitForTimeout(1000); // Wait for manifest to load
  37  |     
  38  |     // Should see all 3 review types
  39  |     await expect(page.locator('.review-period:has-text("2024-W11")')).toBeVisible({ timeout: 10000 }); // weekly
  40  |     await expect(page.locator('.review-period:has-text("2024-03")')).toBeVisible(); // monthly
  41  |     // Yearly: exactly "2024", not containing other text
  42  |     await expect(page.locator('.review-period').filter({ hasText: /^2024$/ })).toBeVisible();
  43  |     
  44  |     // Should see type labels
  45  |     await expect(page.locator('text=周总结').first()).toBeVisible();
  46  |     await expect(page.locator('text=月总结').first()).toBeVisible();
  47  |     await expect(page.locator('text=年终总结').first()).toBeVisible();
  48  |   });
  49  | 
  50  |   test('should render weekly review detail', async ({ page }) => {
  51  |     await page.goto('/#/reviews/weekly/2024-W11');
  52  |     await page.waitForTimeout(1000); // Wait for loading
  53  |     
  54  |     // Check for title in input field or as text
  55  |     const titleInput = page.locator('input#title');
  56  |     await expect(titleInput).toBeVisible({ timeout: 10000 });
  57  |     await expect(titleInput).toHaveValue('第11周总结');
  58  |     
  59  |     // Check content in textarea
  60  |     const contentArea = page.locator('textarea#content');
  61  |     await expect(contentArea).toHaveValue(/本周完成了两天的学习任务/);
  62  |     
  63  |     // Published reviews should have disabled inputs
  64  |     await expect(titleInput).toBeDisabled();
  65  |   });
  66  | 
  67  |   test('should render monthly review detail', async ({ page }) => {
  68  |     await page.goto('/#/reviews/monthly/2024-03');
  69  |     await page.waitForTimeout(1000);
  70  |     
  71  |     const titleInput = page.locator('input#title');
  72  |     await expect(titleInput).toBeVisible({ timeout: 10000 });
> 73  |     await expect(titleInput).toHaveValue('三月总结');
      |                              ^ Error: expect(locator).toHaveValue(expected) failed
  74  |     
  75  |     const contentArea = page.locator('textarea#content');
  76  |     await expect(contentArea).toHaveValue(/三月份建立了四列学习法的框架/);
  77  |   });
  78  | 
  79  |   test('should render yearly review detail', async ({ page }) => {
  80  |     await page.goto('/#/reviews/yearly/2024');
  81  |     await page.waitForTimeout(1000);
  82  |     
  83  |     const titleInput = page.locator('input#title');
  84  |     await expect(titleInput).toBeVisible({ timeout: 10000 });
  85  |     await expect(titleInput).toHaveValue('2024年度总结');
  86  |     
  87  |     const contentArea = page.locator('textarea#content');
  88  |     await expect(contentArea).toHaveValue(/2024年是个人成长系统化的一年/);
  89  |   });
  90  | 
  91  |   test('should allow editing draft review', async ({ page }) => {
  92  |     // Use valid future ISO week (W01 is always valid)
  93  |     await page.goto('/#/reviews/weekly/2099-W01');
  94  |     await page.waitForTimeout(1000);
  95  |     
  96  |     // Should create new draft
  97  |     const titleInput = page.locator('input#title');
  98  |     await expect(titleInput).toBeVisible({ timeout: 10000 });
  99  |     await expect(titleInput).not.toBeDisabled();
  100 |     
  101 |     await titleInput.fill('2099年第1周复盘');
  102 |     await page.locator('textarea#content').fill('这是一个测试复盘内容。');
  103 |     await page.locator('button:has-text("保存")').click();
  104 |     await page.waitForTimeout(500);
  105 |     
  106 |     // Lock and unlock to verify persistence
  107 |     await page.goto('/#/settings');
  108 |     await page.locator('button:has-text("锁定")').click();
  109 |     await page.waitForTimeout(500);
  110 |     
  111 |     // Unlock
  112 |     await page.getByRole('button', { name: '解锁' }).first().click();
  113 |     await page.waitForTimeout(200);
  114 |     await page.locator('#unlock-password').fill(TEST_PASSWORD);
  115 |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  116 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  117 |     
  118 |     // Navigate back - should persist
  119 |     await page.goto('/#/reviews/weekly/2099-W01');
  120 |     await page.waitForTimeout(1000);
  121 |     await expect(page.locator('input#title')).toHaveValue('2099年第1周复盘', { timeout: 10000 });
  122 |     await expect(page.locator('textarea#content')).toHaveValue('这是一个测试复盘内容。');
  123 |   });
  124 | 
  125 |   test('should clear reviews on lock', async ({ page }) => {
  126 |     await page.goto('/#/reviews/weekly/2024-W11');
  127 |     await page.waitForTimeout(1000);
  128 |     // Verify content is loaded
  129 |     await expect(page.locator('input#title')).toHaveValue('第11周总结', { timeout: 10000 });
  130 |     
  131 |     // Lock
  132 |     await page.goto('/#/settings');
  133 |     await page.waitForTimeout(200);
  134 |     await page.locator('button:has-text("锁定")').click();
  135 |     await page.waitForTimeout(500);
  136 |     
  137 |     // Navigate back - should show locked message
  138 |     await page.goto('/#/reviews');
  139 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  140 |   });
  141 | 
  142 |   test('should use exact period keys', async ({ page }) => {
  143 |     await page.goto('/#/reviews');
  144 |     
  145 |     // Check quick create buttons use current period format
  146 |     const quickButtons = page.locator('.action-buttons a');
  147 |     await expect(quickButtons.nth(0)).toContainText('W'); // weekly: YYYY-Www
  148 |     await expect(quickButtons.nth(1)).toContainText('-'); // monthly: YYYY-MM
  149 |     await expect(quickButtons.nth(2)).toHaveAttribute('href', /#\/reviews\/yearly\/\d{4}$/); // yearly: YYYY
  150 |   });
  151 | 
  152 |   test('should reject invalid ISO week formats', async ({ page }) => {
  153 |     // Try to navigate to invalid ISO weeks
  154 |     await page.goto('/#/reviews/weekly/2099-W99'); // Week 99 invalid (max 53)
  155 |     await page.waitForTimeout(1000);
  156 |     
  157 |     // Should show "记录不存在" for invalid period
  158 |     await expect(page.locator('text=记录不存在')).toBeVisible({ timeout: 5000 });
  159 |     
  160 |     // Try week 00
  161 |     await page.goto('/#/reviews/weekly/2024-W00');
  162 |     await page.waitForTimeout(1000);
  163 |     await expect(page.locator('text=记录不存在')).toBeVisible({ timeout: 5000 });
  164 |     
  165 |     // Try week 54
  166 |     await page.goto('/#/reviews/weekly/2024-W54');
  167 |     await page.waitForTimeout(1000);
  168 |     await expect(page.locator('text=记录不存在')).toBeVisible({ timeout: 5000 });
  169 |   });
  170 | 
  171 |   test('should capture screenshots of review detail', async ({ page }) => {
  172 |     // Navigate to weekly review
  173 |     await page.goto('/#/reviews/weekly/2024-W11');
```