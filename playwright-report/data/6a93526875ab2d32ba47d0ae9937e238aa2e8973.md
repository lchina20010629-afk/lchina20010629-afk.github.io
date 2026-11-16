# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capture-screenshots.spec.ts >> capture course and review UI screenshots
- Location: e2e/capture-screenshots.spec.ts:5:1

# Error details

```
Test timeout of 30000ms exceeded.
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
  1  | import { test } from '@playwright/test';
  2  | 
  3  | const TEST_PASSWORD = 'TestPass123!';
  4  | 
  5  | test('capture course and review UI screenshots', async ({ page }) => {
  6  |   // Init vault
  7  |   await page.goto('http://localhost:5173/');
> 8  |   await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
     |                                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  9  |   await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  10 |   await page.locator('button:has-text("初始化保险库")').click();
  11 |   await page.waitForTimeout(1000);
  12 |   
  13 |   // Dashboard
  14 |   await page.screenshot({ path: '/opt/cursor/artifacts/01-dashboard-desktop.png', fullPage: true });
  15 |   
  16 |   // Navigate to Learning
  17 |   await page.goto('http://localhost:5173/#/learning');
  18 |   await page.waitForTimeout(500);
  19 |   await page.screenshot({ path: '/opt/cursor/artifacts/02-learning-list-desktop.png', fullPage: true });
  20 |   
  21 |   // Create today's course record
  22 |   const today = new Date().toISOString().split('T')[0];
  23 |   await page.goto(`http://localhost:5173/#/learning/${today}`);
  24 |   await page.waitForTimeout(1000);
  25 |   await page.screenshot({ path: '/opt/cursor/artifacts/03-course-detail-desktop.png', fullPage: true });
  26 |   
  27 |   // Navigate to Reviews
  28 |   await page.goto('http://localhost:5173/#/reviews');
  29 |   await page.waitForTimeout(500);
  30 |   await page.screenshot({ path: '/opt/cursor/artifacts/04-reviews-list-desktop.png', fullPage: true });
  31 |   
  32 |   // Mobile viewport
  33 |   await page.setViewportSize({ width: 375, height: 667 });
  34 |   
  35 |   await page.goto('http://localhost:5173/#/learning');
  36 |   await page.waitForTimeout(500);
  37 |   await page.screenshot({ path: '/opt/cursor/artifacts/05-learning-list-mobile.png', fullPage: true });
  38 |   
  39 |   await page.goto(`http://localhost:5173/#/learning/${today}`);
  40 |   await page.waitForTimeout(1000);
  41 |   await page.screenshot({ path: '/opt/cursor/artifacts/06-course-detail-mobile.png', fullPage: true });
  42 |   
  43 |   await page.goto('http://localhost:5173/#/reviews');
  44 |   await page.waitForTimeout(500);
  45 |   await page.screenshot({ path: '/opt/cursor/artifacts/07-reviews-list-mobile.png', fullPage: true });
  46 | });
  47 | 
```