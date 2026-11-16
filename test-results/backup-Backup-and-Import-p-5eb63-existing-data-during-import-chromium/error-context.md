# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup.spec.ts >> Backup and Import >> preserves existing data during import
- Location: e2e/backup.spec.ts:118:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/跳过.*1 条已存在记录/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/跳过.*1 条已存在记录/) with timeout 5000ms
  - waiting for getByText(/跳过.*1 条已存在记录/)

```

```yaml
- complementary:
  - heading "个人成长" [level=1]
  - paragraph: 生活 • 学习 • 成长
  - navigation:
    - link "今日总览":
      - /url: /
      - img
      - text: 今日总览
    - link "生活日记":
      - /url: /diary
      - img
      - text: 生活日记
    - link "成长学习":
      - /url: /learning
      - img
      - text: 成长学习
    - link "总结回顾":
      - /url: /reviews
      - img
      - text: 总结回顾
    - link "设置":
      - /url: /settings
      - img
      - text: 设置
  - 'button "当前主题: 跟随系统"':
    - img
- main:
  - heading "设置" [level=1]
  - paragraph: 管理您的个人数据和偏好
  - heading "🔒 保险库状态" [level=2]
  - img
  - heading "保险库已解锁" [level=3]
  - paragraph: 您可以查看和编辑加密数据
  - button "锁定":
    - img
    - text: 锁定
  - heading "💾 备份与恢复" [level=2]
  - paragraph: 导出和导入加密备份数据
  - button "导出备份":
    - img
    - text: 导出备份
  - button "导入备份":
    - img
    - text: 导入备份
  - img
  - text: "导入成功: 0 条新记录，跳过 0 条已存在记录"
  - paragraph: ⚠️ 导入时使用您当前的密码解密备份。如果备份使用不同的密码，导入将失败。 已存在的数据不会被覆盖。
  - heading "ℹ️ 隐私与安全说明" [level=2]
  - list:
    - listitem: ✅ 所有个人数据使用 AES-256-GCM 加密
    - listitem: ✅ 密钥派生使用 PBKDF2-SHA256 (600,000 次迭代)
    - listitem: ✅ 数据仅保存在当前浏览器的 IndexedDB 中
    - listitem: ⚠️ 公开的 GitHub 仓库仅包含加密后的密文
    - listitem: ⚠️ 弱密码可能被离线暴力破解，请使用强密码
    - listitem: ⚠️ 浏览器清除数据会导致本地内容丢失
    - listitem: 📦 建议定期导出加密备份到安全位置
```

# Test source

```ts
  46  |     await page.locator('#date').fill(today);
  47  |     await page.locator('#title').fill('Test Export Entry');
  48  |     await page.locator('#content').fill('Content for export test.');
  49  |     await page.getByRole('button', { name: '保存' }).click();
  50  |     await expect(page).toHaveURL(`http://localhost:5173/diary/${today}`);
  51  | 
  52  |     // Export backup
  53  |     await page.goto('http://localhost:5173/settings');
  54  |     
  55  |     const downloadPromise = page.waitForEvent('download');
  56  |     await page.getByRole('button', { name: '导出备份' }).click();
  57  |     const download = await downloadPromise;
  58  |     
  59  |     const downloadPath = join(__dirname, '../temp-backup.json');
  60  |     await download.saveAs(downloadPath);
  61  | 
  62  |     // Clear storage - navigate to app first to get proper context
  63  |     await context.clearCookies();
  64  |     await page.goto('http://localhost:5173');
  65  |     
  66  |     await page.evaluate(async () => {
  67  |       // Close any open DB connections
  68  |       sessionStorage.clear();
  69  |       localStorage.clear();
  70  |       
  71  |       // Delete databases
  72  |       const dbs = await indexedDB.databases();
  73  |       for (const db of dbs) {
  74  |         if (db.name) {
  75  |           indexedDB.deleteDatabase(db.name);
  76  |         }
  77  |       }
  78  |     });
  79  |     
  80  |     await page.waitForTimeout(500);
  81  | 
  82  |     // Re-initialize vault with same password
  83  |     await page.goto('http://localhost:5173/settings');
  84  |     await page.getByRole('button', { name: '初始化保险库' }).click();
  85  |     await page.locator('#password').fill(testPassword);
  86  |     await page.locator('#confirm-password').fill(testPassword);
  87  |     await page.getByRole('button', { name: '确认初始化' }).click();
  88  |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  89  | 
  90  |     // Import backup
  91  |     await page.locator('input[type="file"]').setInputFiles(downloadPath);
  92  |     await expect(page.getByText(/导入成功.*1 条新记录/)).toBeVisible({ timeout: 5000 });
  93  | 
  94  |     // Verify imported data
  95  |     await page.goto('http://localhost:5173/diary');
  96  |     await page.getByText('Test Export Entry').click();
  97  |     await expect(page.getByText('Content for export test.')).toBeVisible();
  98  |   });
  99  | 
  100 |   test('rejects import with wrong password', async ({ page }) => {
  101 |     // Export with current password
  102 |     await page.goto('http://localhost:5173/settings');
  103 |     const downloadPromise = page.waitForEvent('download');
  104 |     await page.getByRole('button', { name: '导出备份' }).click();
  105 |     const download = await downloadPromise;
  106 |     const downloadPath = join(__dirname, '../temp-wrong-pw.json');
  107 |     await download.saveAs(downloadPath);
  108 | 
  109 |     // Lock and unlock with wrong password would fail, so we simulate by trying to import
  110 |     // a backup made with a different password (we'll create a new vault)
  111 |     await page.getByRole('button', { name: '锁定' }).click();
  112 | 
  113 |     // Change context - in reality you'd init with different password
  114 |     // For this test, we just verify the error handling exists
  115 |     // The import will fail because the backup is encrypted with testPassword
  116 |   });
  117 | 
  118 |   test('preserves existing data during import', async ({ page, context }) => {
  119 |     // Create first entry
  120 |     await page.goto('http://localhost:5173/diary/create');
  121 |     const today = new Date().toISOString().split('T')[0];
  122 |     await page.locator('#date').fill(today);
  123 |     await page.locator('#title').fill('Existing Entry');
  124 |     await page.locator('#content').fill('Original content.');
  125 |     await page.getByRole('button', { name: '保存' }).click();
  126 | 
  127 |     // Export
  128 |     await page.goto('http://localhost:5173/settings');
  129 |     const downloadPromise = page.waitForEvent('download');
  130 |     await page.getByRole('button', { name: '导出备份' }).click();
  131 |     const download = await downloadPromise;
  132 |     const downloadPath = join(__dirname, '../temp-preserve.json');
  133 |     await download.saveAs(downloadPath);
  134 | 
  135 |     // Create second entry (not in backup)
  136 |     await page.goto('http://localhost:5173/diary/create');
  137 |     const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  138 |     await page.locator('#date').fill(yesterday);
  139 |     await page.locator('#title').fill('New Entry After Export');
  140 |     await page.locator('#content').fill('Should be preserved.');
  141 |     await page.getByRole('button', { name: '保存' }).click();
  142 | 
  143 |     // Import old backup
  144 |     await page.goto('http://localhost:5173/settings');
  145 |     await page.locator('input[type="file"]').setInputFiles(downloadPath);
> 146 |     await expect(page.getByText(/跳过.*1 条已存在记录/)).toBeVisible({ timeout: 5000 });
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  147 | 
  148 |     // Both entries should exist
  149 |     await page.goto('http://localhost:5173/diary');
  150 |     await expect(page.getByText('Existing Entry')).toBeVisible();
  151 |     await expect(page.getByText('New Entry After Export')).toBeVisible();
  152 |   });
  153 | });
  154 | 
```