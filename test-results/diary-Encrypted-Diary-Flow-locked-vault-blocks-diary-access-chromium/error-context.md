# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diary.spec.ts >> Encrypted Diary Flow >> locked vault blocks diary access
- Location: e2e/diary.spec.ts:105:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '锁定' })

```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - complementary [ref=f2e4]:
    - generic [ref=f2e5]:
      - heading "个人成长" [level=1] [ref=f2e6]
      - paragraph [ref=f2e7]: 生活 • 学习 • 成长
    - navigation [ref=f2e8]:
      - link "今日总览" [ref=f2e9] [cursor=pointer]:
        - /url: /
      - link "生活日记" [ref=f2e14] [cursor=pointer]:
        - /url: /diary
      - link "成长学习" [ref=f2e18] [cursor=pointer]:
        - /url: /learning
      - link "总结回顾" [ref=f2e22] [cursor=pointer]:
        - /url: /reviews
      - link "设置" [ref=f2e27] [cursor=pointer]:
        - /url: /settings
    - 'button "当前主题: 跟随系统" [ref=f2e33] [cursor=pointer]'
  - main [ref=f2e36]:
    - generic [ref=f2e37]:
      - generic [ref=f2e38]:
        - heading "设置" [level=1] [ref=f2e39]
        - paragraph [ref=f2e40]: 管理您的个人数据和偏好
      - generic [ref=f2e41]:
        - heading "🔒 保险库状态" [level=2] [ref=f2e42]
        - generic [ref=f2e44]:
          - generic [ref=f2e48]:
            - heading "保险库已锁定" [level=3] [ref=f2e49]
            - paragraph [ref=f2e50]: 请输入密码解锁以访问数据
          - button "解锁" [ref=f2e51] [cursor=pointer]
      - generic [ref=f2e55]:
        - heading "ℹ️ 隐私与安全说明" [level=2] [ref=f2e56]
        - list [ref=f2e58]:
          - listitem [ref=f2e59]: ✅ 所有个人数据使用 AES-256-GCM 加密
          - listitem [ref=f2e60]: ✅ 密钥派生使用 PBKDF2-SHA256 (600,000 次迭代)
          - listitem [ref=f2e61]: ✅ 数据仅保存在当前浏览器的 IndexedDB 中
          - listitem [ref=f2e62]: ⚠️ 公开的 GitHub 仓库仅包含加密后的密文
          - listitem [ref=f2e63]: ⚠️ 弱密码可能被离线暴力破解，请使用强密码
          - listitem [ref=f2e64]: ⚠️ 浏览器清除数据会导致本地内容丢失
          - listitem [ref=f2e65]: 📦 建议定期导出加密备份到安全位置
```

# Test source

```ts
  8   | test.describe('Encrypted Diary Flow', () => {
  9   |   const testPassword = 'TestPassword123!@#Strong';
  10  |   
  11  |   test.beforeEach(async ({ page, context }) => {
  12  |     await context.clearCookies();
  13  |     await page.goto('http://localhost:5173/settings');
  14  |     
  15  |     // Clear IndexedDB
  16  |     await page.evaluate(async () => {
  17  |       const dbs = await indexedDB.databases();
  18  |       for (const db of dbs) {
  19  |         if (db.name) {
  20  |           indexedDB.deleteDatabase(db.name);
  21  |         }
  22  |       }
  23  |       localStorage.clear();
  24  |       sessionStorage.clear();
  25  |     });
  26  |     
  27  |     await page.reload();
  28  |     
  29  |     // Initialize vault
  30  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  31  |     await page.locator('#password').fill(testPassword);
  32  |     await page.locator('#confirm-password').fill(testPassword);
  33  |     await page.getByRole('button', { name: '确认初始化' }).click();
  34  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  35  |   });
  36  | 
  37  |   test('creates diary with Unicode content and photo', async ({ page }) => {
  38  |     await page.goto('http://localhost:5173/diary');
  39  |     await page.getByText('创建日记').click();
  40  |     
  41  |     // Wait for form to load
  42  |     await page.waitForSelector('#date');
  43  |     
  44  |     const today = new Date().toISOString().split('T')[0];
  45  |     await page.locator('#date').fill(today);
  46  |     await page.locator('#title').fill('测试日记 🌟');
  47  |     await page.locator('#content').fill('今天天气很好，心情也不错。\n这是第二行内容。\n包含中文、emoji 😊 和 English mixed text.');
  48  |     await page.locator('#mood').fill('开心');
  49  |     await page.locator('#weather').fill('晴天');
  50  |     await page.locator('#tags').fill('测试, 心情, Unicode');
  51  |     
  52  |     // Skip image upload for now - requires valid image file
  53  |     // await page.locator('#images').setInputFiles(testImagePath);
  54  |     
  55  |     await page.getByText('保存').click();
  56  |     
  57  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`, { timeout: 10000 });
  58  |     await expect(page.getByText('测试日记 🌟')).toBeVisible();
  59  |   });
  60  | 
  61  |   test('views and edits existing diary entry', async ({ page }) => {
  62  |     // Create entry first
  63  |     await page.goto('http://localhost:5173/diary/create');
  64  |     const today = new Date().toISOString().split('T')[0];
  65  |     await page.locator('#date').fill(today);
  66  |     await page.locator('#title').fill('Original Title');
  67  |     await page.locator('#content').fill('Original content here.');
  68  |     await page.getByRole('button', { name: '保存' }).click();
  69  |     
  70  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  71  |     await expect(page.getByText('Original Title')).toBeVisible();
  72  |     
  73  |     // Edit it
  74  |     await page.getByRole('button', { name: '编辑' }).click();
  75  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}/edit`);
  76  |     
  77  |     await page.locator('#title').fill('Updated Title');
  78  |     await page.locator('#content').fill('Updated content with changes.');
  79  |     await page.getByRole('button', { name: '保存' }).click();
  80  |     
  81  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  82  |     await expect(page.getByText('Updated Title')).toBeVisible();
  83  |     await expect(page.getByText('Updated content with changes.')).toBeVisible();
  84  |   });
  85  | 
  86  |   test('deletes diary entry', async ({ page }) => {
  87  |     // Create entry
  88  |     await page.goto('http://localhost:5173/diary/create');
  89  |     const today = new Date().toISOString().split('T')[0];
  90  |     await page.locator('#date').fill(today);
  91  |     await page.locator('#title').fill('Entry to Delete');
  92  |     await page.locator('#content').fill('This will be deleted.');
  93  |     await page.getByRole('button', { name: '保存' }).click();
  94  |     
  95  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  96  |     
  97  |     // Set up dialog handler before clicking delete
  98  |     page.on('dialog', dialog => dialog.accept());
  99  |     
  100 |     await page.getByRole('button', { name: '删除' }).click();
  101 |     
  102 |     await expect(page).toHaveURL('http://localhost:5173/diary');
  103 |   });
  104 | 
  105 |   test('locked vault blocks diary access', async ({ page }) => {
  106 |     // Lock vault
  107 |     await page.goto('http://localhost:5173/settings');
> 108 |     await page.getByRole('button', { name: '锁定' }).click();
      |                                                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  109 |     
  110 |     await page.goto('http://localhost:5173/diary');
  111 |     await expect(page.getByText('请先解锁保险库')).toBeVisible();
  112 |   });
  113 | });
  114 | 
```