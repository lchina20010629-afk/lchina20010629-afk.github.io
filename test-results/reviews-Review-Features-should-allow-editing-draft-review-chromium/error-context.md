# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reviews.spec.ts >> Review Features >> should allow editing draft review
- Location: e2e/reviews.spec.ts:91:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: locator('input#title')
Expected: "Test Week Review"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" locator('input#title') with timeout 10000ms
  - waiting for locator('input#title')

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
  - paragraph: 请先解锁保险库
```

# Test source

```ts
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
  73  |     await expect(titleInput).toHaveValue('三月总结');
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
  92  |     await page.goto('/#/reviews/weekly/2099-W99');
  93  |     await page.waitForTimeout(1000);
  94  |     
  95  |     // Should create new draft
  96  |     const titleInput = page.locator('input#title');
  97  |     await expect(titleInput).toBeVisible({ timeout: 10000 });
  98  |     await expect(titleInput).not.toBeDisabled();
  99  |     
  100 |     await titleInput.fill('Test Week Review');
  101 |     await page.locator('textarea#content').fill('This is a test review');
  102 |     await page.locator('button:has-text("保存")').click();
  103 |     await page.waitForTimeout(500);
  104 |     
  105 |     // Reload - should persist
  106 |     await page.reload();
  107 |     await page.waitForTimeout(1000);
> 108 |     await expect(page.locator('input#title')).toHaveValue('Test Week Review', { timeout: 10000 });
      |                                               ^ Error: expect(locator).toHaveValue(expected) failed
  109 |     await expect(page.locator('textarea#content')).toHaveValue('This is a test review');
  110 |   });
  111 | 
  112 |   test('should clear reviews on lock', async ({ page }) => {
  113 |     await page.goto('/#/reviews/weekly/2024-W11');
  114 |     await page.waitForTimeout(1000);
  115 |     // Verify content is loaded
  116 |     await expect(page.locator('input#title')).toHaveValue('第11周总结', { timeout: 10000 });
  117 |     
  118 |     // Lock
  119 |     await page.goto('/#/settings');
  120 |     await page.waitForTimeout(200);
  121 |     await page.locator('button:has-text("锁定")').click();
  122 |     await page.waitForTimeout(500);
  123 |     
  124 |     // Navigate back - should show locked message
  125 |     await page.goto('/#/reviews');
  126 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible({ timeout: 10000 });
  127 |   });
  128 | 
  129 |   test('should use exact period keys', async ({ page }) => {
  130 |     await page.goto('/#/reviews');
  131 |     
  132 |     // Check quick create buttons use current period format
  133 |     const quickButtons = page.locator('.action-buttons a');
  134 |     await expect(quickButtons.nth(0)).toContainText('W'); // weekly: YYYY-Www
  135 |     await expect(quickButtons.nth(1)).toContainText('-'); // monthly: YYYY-MM
  136 |     await expect(quickButtons.nth(2)).toHaveAttribute('href', /#\/reviews\/yearly\/\d{4}$/); // yearly: YYYY
  137 |   });
  138 | });
  139 | 
```