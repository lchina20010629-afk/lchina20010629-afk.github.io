# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security: No Secret Persistence >> locked state shows no decrypted content
- Location: e2e/security.spec.ts:90:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '初始化保险库' })

```

# Page snapshot

```yaml
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
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Security tests: Verify no sensitive data persists in storage
  5   |  */
  6   | 
  7   | test.describe('Security: No Secret Persistence', () => {
  8   |   const testPassword = 'TestPassword123!@#Strong';
  9   | 
  10  |   test.beforeEach(async ({ page, context }) => {
  11  |     await context.clearCookies();
  12  |     await page.goto('http://localhost:5173/settings');
  13  |     
  14  |     await page.evaluate(async () => {
  15  |       const dbs = await indexedDB.databases();
  16  |       for (const db of dbs) {
  17  |         if (db.name) indexedDB.deleteDatabase(db.name);
  18  |       }
  19  |       localStorage.clear();
  20  |       sessionStorage.clear();
  21  |     });
  22  |     
  23  |     await page.reload();
  24  |   });
  25  | 
  26  |   test('no plaintext password in storage after initialize', async ({ page }) => {
  27  |     // Initialize vault
  28  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  29  |     await page.locator('#password').fill(testPassword);
  30  |     await page.locator('#confirm-password').fill(testPassword);
  31  |     await page.getByRole('button', { name: '确认初始化' }).click();
  32  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  33  | 
  34  |     // Check storage
  35  |     const storage = await page.evaluate(() => ({
  36  |       localStorage: JSON.stringify(localStorage),
  37  |       sessionStorage: JSON.stringify(sessionStorage),
  38  |     }));
  39  | 
  40  |     // Password should NOT be in storage
  41  |     expect(storage.localStorage).not.toContain(testPassword);
  42  |     expect(storage.sessionStorage).not.toContain(testPassword);
  43  |     expect(storage.localStorage).not.toContain('password');
  44  |     expect(storage.sessionStorage).not.toContain('password');
  45  |   });
  46  | 
  47  |   test('no plaintext password in storage after unlock', async ({ page }) => {
  48  |     // Initialize
  49  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  50  |     await page.locator('#password').fill(testPassword);
  51  |     await page.locator('#confirm-password').fill(testPassword);
  52  |     await page.getByRole('button', { name: '确认初始化' }).click();
  53  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  54  | 
  55  |     // Lock
  56  |     await page.getByRole('button', { name: '锁定' }).click();
  57  | 
  58  |     // Unlock
  59  |     await page.getByRole('button', { name: '解锁' }).first().click();
  60  |     await page.locator('#unlock-password').fill(testPassword);
  61  |     await page.locator('form').filter({ hasText: '密码' }).getByRole('button', { name: '解锁' }).click();
  62  |     await expect(page.getByText('保险库已解锁')).toBeVisible();
  63  | 
  64  |     // Check storage again
  65  |     const storage = await page.evaluate(() => ({
  66  |       localStorage: JSON.stringify(localStorage),
  67  |       sessionStorage: JSON.stringify(sessionStorage),
  68  |     }));
  69  | 
  70  |     expect(storage.localStorage).not.toContain(testPassword);
  71  |     expect(storage.sessionStorage).not.toContain(testPassword);
  72  |   });
  73  | 
  74  |   test('full page reload requires re-unlock', async ({ page }) => {
  75  |     // Initialize
  76  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  77  |     await page.locator('#password').fill(testPassword);
  78  |     await page.locator('#confirm-password').fill(testPassword);
  79  |     await page.getByRole('button', { name: '确认初始化' }).click();
  80  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  81  | 
  82  |     // Full page reload
  83  |     await page.reload();
  84  | 
  85  |     // Should be locked after reload
  86  |     await page.goto('http://localhost:5173/settings');
  87  |     await expect(page.getByText('保险库已锁定')).toBeVisible();
  88  |   });
  89  | 
  90  |   test('locked state shows no decrypted content', async ({ page }) => {
  91  |     // Initialize and create entry
> 92  |     await page.getByRole('button', { name: '初始化保险库' }).click();
      |                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  93  |     await page.locator('#password').fill(testPassword);
  94  |     await page.locator('#confirm-password').fill(testPassword);
  95  |     await page.getByRole('button', { name: '确认初始化' }).click();
  96  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  97  | 
  98  |     // Create diary with private content
  99  |     await page.click('a[href="/diary"]');
  100 |     await page.waitForTimeout(200);
  101 |     await page.getByText('创建日记').click();
  102 |     await page.waitForSelector('#date');
  103 |     
  104 |     const secretContent = 'PRIVATE_SECRET_DATA_12345';
  105 |     await page.locator('#date').fill(new Date().toISOString().split('T')[0]);
  106 |     await page.locator('#title').fill('Secret Entry');
  107 |     await page.locator('#content').fill(secretContent);
  108 |     await page.getByRole('button', { name: '保存' }).click();
  109 |     await page.waitForTimeout(1000);
  110 | 
  111 |     // Lock vault
  112 |     await page.click('a[href="/settings"]');
  113 |     await page.waitForTimeout(200);
  114 |     await page.getByRole('button', { name: '锁定' }).click();
  115 | 
  116 |     // Navigate to diary - should not show secret content
  117 |     await page.click('a[href="/diary"]');
  118 |     await page.waitForTimeout(200);
  119 |     
  120 |     const bodyText = await page.textContent('body');
  121 |     expect(bodyText).not.toContain(secretContent);
  122 |     expect(bodyText).toContain('请先解锁保险库');
  123 |   });
  124 | 
  125 |   test('no password-derived keys in IndexedDB', async ({ page }) => {
  126 |     // Initialize
  127 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  128 |     await page.locator('#password').fill(testPassword);
  129 |     await page.locator('#confirm-password').fill(testPassword);
  130 |     await page.getByRole('button', { name: '确认初始化' }).click();
  131 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  132 | 
  133 |     // Check IndexedDB contents
  134 |     const dbData = await page.evaluate(async () => {
  135 |       const db = await new Promise<IDBDatabase>((resolve, reject) => {
  136 |         const request = indexedDB.open('life-growth-db');
  137 |         request.onsuccess = () => resolve(request.result);
  138 |         request.onerror = () => reject(request.error);
  139 |       });
  140 | 
  141 |       const tx = db.transaction('settings', 'readonly');
  142 |       const store = tx.objectStore('settings');
  143 |       const allKeys = await new Promise<string[]>((resolve) => {
  144 |         const req = store.getAllKeys();
  145 |         req.onsuccess = () => resolve(req.result as string[]);
  146 |       });
  147 | 
  148 |       const data: Record<string, unknown> = {};
  149 |       for (const key of allKeys) {
  150 |         const value = await new Promise((resolve) => {
  151 |           const req = store.get(key);
  152 |           req.onsuccess = () => resolve(req.result);
  153 |         });
  154 |         data[key] = value;
  155 |       }
  156 | 
  157 |       return JSON.stringify(data);
  158 |     });
  159 | 
  160 |     // Password should NOT be in IndexedDB
  161 |     expect(dbData).not.toContain(testPassword);
  162 |     // Only verifier should exist (contains salt and verifier, no password)
  163 |     expect(dbData).toContain('password_verifier');
  164 |   });
  165 | });
  166 | 
```