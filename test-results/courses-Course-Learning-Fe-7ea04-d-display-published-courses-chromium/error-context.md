# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: courses.spec.ts >> Course/Learning Features >> should load and display published courses
- Location: e2e/courses.spec.ts:28:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="password"]').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - heading "个人成长" [level=1] [ref=e6]
      - paragraph [ref=e7]: 生活 • 学习 • 成长
    - navigation [ref=e8]:
      - link "今日总览" [ref=e9] [cursor=pointer]:
        - /url: "#/"
      - link "生活日记" [ref=e14] [cursor=pointer]:
        - /url: "#/diary"
      - link "成长学习" [ref=e18] [cursor=pointer]:
        - /url: "#/learning"
      - link "总结回顾" [ref=e22] [cursor=pointer]:
        - /url: "#/reviews"
      - link "设置" [ref=e27] [cursor=pointer]:
        - /url: "#/settings"
    - 'button "当前主题: 跟随系统" [ref=e33] [cursor=pointer]'
  - main [ref=e36]:
    - generic [ref=e37]:
      - generic [ref=e39]:
        - heading "今日总览" [level=1] [ref=e40]
        - paragraph [ref=e41]: 2026-11-17 • 今天
      - generic [ref=e42]:
        - generic [ref=e43]:
          - heading "生活日记" [level=3] [ref=e47]
          - paragraph [ref=e48]: 记录今天的点滴
          - link "查看日记" [ref=e49] [cursor=pointer]:
            - /url: "#/diary"
        - generic [ref=e50]:
          - heading "成长学习" [level=3] [ref=e54]
          - paragraph [ref=e55]: 今日学习进度
          - link "查看学习" [ref=e56] [cursor=pointer]:
            - /url: "#/learning"
        - generic [ref=e57]:
          - heading "总结回顾" [level=3] [ref=e62]
          - paragraph [ref=e63]: 周/月/年度回顾
          - link "查看总结" [ref=e64] [cursor=pointer]:
            - /url: "#/reviews"
      - generic [ref=e66]:
        - heading "暂无数据" [level=3] [ref=e71]
        - paragraph [ref=e72]: 这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。
        - button "前往设置" [ref=e73] [cursor=pointer]
      - generic [ref=e74]:
        - heading "📅 外部自动化流程说明" [level=4] [ref=e75]
        - paragraph [ref=e76]: 您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
        - list [ref=e77]:
          - listitem [ref=e78]: 每天 10:30 - 课程准备
          - listitem [ref=e79]: 每天 23:30 - 日记整理润色
          - listitem [ref=e80]: 每周日 - 周总结
          - listitem [ref=e81]: 每月最后一天 - 月总结
          - listitem [ref=e82]: 12月31日 - 年终总结
        - paragraph [ref=e83]: ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
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
  9   |   test.beforeEach(async ({ page }) => {
  10  |     // Copy fixtures to dist/data
  11  |     await fs.cp(join(FIXTURES_DIR, 'manifest.json'), join(process.cwd(), 'dist/data/manifest.json'), { recursive: true });
  12  |     await fs.cp(join(FIXTURES_DIR, 'encrypted'), join(process.cwd(), 'dist/data/encrypted'), { recursive: true });
  13  |     
  14  |     // Init vault and unlock
  15  |     await page.goto('http://localhost:8174/');
> 16  |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
      |                                                          ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  17  |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  18  |     await page.locator('button:has-text("初始化保险库")').click();
  19  |     await page.waitForURL('**/'); // Back to dashboard
  20  |   });
  21  | 
  22  |   test.afterEach(async () => {
  23  |     // Clean up dist/data
  24  |     await fs.rm(join(process.cwd(), 'dist/data'), { recursive: true, force: true });
  25  |     await fs.mkdir(join(process.cwd(), 'dist/data'));
  26  |   });
  27  | 
  28  |   test('should load and display published courses', async ({ page }) => {
  29  |     await page.goto('http://localhost:8174/#/learning');
  30  |     
  31  |     // Should see course entries
  32  |     await expect(page.locator('text=2024-03-15')).toBeVisible();
  33  |     await expect(page.locator('text=2024-03-16')).toBeVisible();
  34  |     
  35  |     // Both should show published badge
  36  |     await expect(page.locator('.published-badge').first()).toBeVisible();
  37  |   });
  38  | 
  39  |   test('should render course detail with 4 columns', async ({ page }) => {
  40  |     await page.goto('http://localhost:8174/#/learning/2024-03-16');
  41  |     
  42  |     // Check all 4 column headers
  43  |     await expect(page.locator('text=英语')).toBeVisible();
  44  |     await expect(page.locator('text=泰语')).toBeVisible();
  45  |     await expect(page.locator('text=修身养性')).toBeVisible();
  46  |     await expect(page.locator('text=生财有道')).toBeVisible();
  47  |     
  48  |     // Check materials
  49  |     await expect(page.locator('text=TED Talk: The power of words')).toBeVisible();
  50  |     await expect(page.locator('text=Thai script practice')).toBeVisible();
  51  |     await expect(page.locator('text=道德经 第一章')).toBeVisible();
  52  |     await expect(page.locator('text=Tesla vertical integration case')).toBeVisible();
  53  |     
  54  |     // Check reflections
  55  |     await expect(page.locator('text=Learned new idioms')).toBeVisible();
  56  |     await expect(page.locator('text=Supply chain strategy insights')).toBeVisible();
  57  |     
  58  |     // Check summary stats
  59  |     await expect(page.locator('text=30分钟')).toBeVisible(); // total minutes
  60  |     await expect(page.locator('text=100%')).toBeVisible(); // completion rate
  61  |   });
  62  | 
  63  |   test('should track explicit completion toggles locally', async ({ page }) => {
  64  |     const today = new Date().toISOString().split('T')[0];
  65  |     await page.goto(`http://localhost:8174/#/learning/${today}`);
  66  |     
  67  |     // All courses start uncompleted
  68  |     const firstToggle = page.locator('.completion-toggle').first();
  69  |     await expect(firstToggle.locator('text=未完成')).toBeVisible();
  70  |     
  71  |     // Toggle completion
  72  |     await firstToggle.click();
  73  |     await expect(firstToggle.locator('text=已完成')).toBeVisible();
  74  |     
  75  |     // Reload page - should persist
  76  |     await page.reload();
  77  |     await expect(firstToggle.locator('text=已完成')).toBeVisible();
  78  |   });
  79  | 
  80  |   test('should store and display reflection locally', async ({ page }) => {
  81  |     const today = new Date().toISOString().split('T')[0];
  82  |     await page.goto(`http://localhost:8174/#/learning/${today}`);
  83  |     
  84  |     // Enter reflection in first column
  85  |     const textarea = page.locator('textarea').first();
  86  |     await textarea.fill('Great progress on grammar today!');
  87  |     await page.waitForTimeout(500); // Wait for save
  88  |     
  89  |     // Reload - should persist
  90  |     await page.reload();
  91  |     await expect(page.locator('textarea').first()).toHaveValue('Great progress on grammar today!');
  92  |   });
  93  | 
  94  |   test('should clear course data on lock', async ({ page }) => {
  95  |     await page.goto('http://localhost:8174/#/learning/2024-03-16');
  96  |     await expect(page.locator('text=TED Talk')).toBeVisible();
  97  |     
  98  |     // Lock
  99  |     await page.goto('http://localhost:8174/#/settings');
  100 |     await page.locator('button:has-text("锁定")').click();
  101 |     
  102 |     // Navigate back - should show locked message
  103 |     await page.goto('http://localhost:8174/#/learning/2024-03-16');
  104 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible();
  105 |     await expect(page.locator('text=TED Talk')).not.toBeVisible();
  106 |   });
  107 | 
  108 |   test('should not allow editing published courses', async ({ page }) => {
  109 |     await page.goto('http://localhost:8174/#/learning/2024-03-16');
  110 |     
  111 |     // Completion toggle should be disabled
  112 |     const toggle = page.locator('.completion-toggle').first();
  113 |     await expect(toggle).toBeDisabled();
  114 |     
  115 |     // Reflection fields should not exist (published uses <p> not <textarea>)
  116 |     await expect(page.locator('textarea')).not.toBeVisible();
```