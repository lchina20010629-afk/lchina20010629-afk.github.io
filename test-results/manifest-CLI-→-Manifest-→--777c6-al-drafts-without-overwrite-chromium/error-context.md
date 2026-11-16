# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manifest.spec.ts >> CLI → Manifest → Browser Loader >> merges published and local drafts without overwrite
- Location: e2e/manifest.spec.ts:168:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a[href="#/diary/2026-11-16"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('a[href="#/diary/2026-11-16"]') with timeout 5000ms
  - waiting for locator('a[href="#/diary/2026-11-16"]')

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
  - heading "生活日记" [level=1]
  - paragraph: 记录每一天的点滴瞬间
  - link "创建日记":
    - /url: "#/diary/create"
    - img
    - text: 创建日记
  - link "2026-11-15 点击查看详情":
    - /url: "#/diary/2026-11-15"
```

# Test source

```ts
  105 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  106 |     });
  107 | 
  108 |     // Initialize vault
  109 |     await page.reload();
  110 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  111 |     await page.locator('#password').fill(TEST_PASSWORD);
  112 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  113 |     await page.getByRole('button', { name: '确认初始化' }).click();
  114 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  115 | 
  116 |     // Navigate directly to diary detail via deep link (hash routing)
  117 |     await page.goto('/#/diary/2026-11-16');
  118 |     await page.waitForTimeout(1000);
  119 |     
  120 |     // Should see content (vault still unlocked)
  121 |     await expect(page.getByText('测试日记标题 🌟')).toBeVisible();
  122 | 
  123 |     // Full page reload locks vault - verify by going to a page and seeing locked state
  124 |     await page.reload();
  125 |     await page.waitForTimeout(1000);
  126 | 
  127 |     // Deep link with hash routing preserved URL, but vault is locked
  128 |     await expect(page.getByText('请先解锁保险库')).toBeVisible();
  129 |   });
  130 | 
  131 |   test('rejects wrong password for published entries', async ({ page, context }) => {
  132 |     await context.clearCookies();
  133 |     await page.goto('/#/settings');
  134 |     await page.evaluate(async () => {
  135 |       const dbs = await indexedDB.databases();
  136 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  137 |     });
  138 | 
  139 |     // Initialize with WRONG password
  140 |     await page.reload();
  141 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  142 |     await page.locator('#password').fill('WrongPassword123!@#');
  143 |     await page.locator('#confirm-password').fill('WrongPassword123!@#');
  144 |     await page.getByRole('button', { name: '确认初始化' }).click();
  145 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  146 | 
  147 |     // Try to view published entry
  148 |     await page.click('a[href="#/diary"]');
  149 |     await page.waitForTimeout(500);
  150 | 
  151 |     // Entry may show in list (metadata is public) but decryption should fail
  152 |     const entry = page.locator('a[href="#/diary/2026-11-16"]');
  153 |     const entryExists = await entry.count();
  154 | 
  155 |     if (entryExists > 0) {
  156 |       await entry.click();
  157 |       await page.waitForTimeout(500);
  158 | 
  159 |       // Should show error or empty content (decryption failed)
  160 |       const hasError = await page.getByText('加载失败').count();
  161 |       const hasContent = await page.getByText('测试日记标题').count();
  162 |       
  163 |       // Either shows error OR entry not found
  164 |       expect(hasError > 0 || hasContent === 0).toBeTruthy();
  165 |     }
  166 |   });
  167 | 
  168 |   test('merges published and local drafts without overwrite', async ({ page, context }) => {
  169 |     // Clear storage
  170 |     await context.clearCookies();
  171 |     await page.goto('/#/settings');
  172 |     await page.evaluate(async () => {
  173 |       const dbs = await indexedDB.databases();
  174 |       for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  175 |     });
  176 | 
  177 |     // Initialize vault
  178 |     await page.reload();
  179 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  180 |     await page.locator('#password').fill(TEST_PASSWORD);
  181 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  182 |     await page.getByRole('button', { name: '确认初始化' }).click();
  183 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  184 | 
  185 |     // Create local draft for DIFFERENT date
  186 |     await page.click('a[href="#/diary"]');
  187 |     await page.waitForTimeout(200);
  188 |     await page.getByText('创建日记').click();
  189 |     const localDate = '2026-11-15';
  190 |     await page.locator('#date').fill(localDate);
  191 |     await page.locator('#title').fill('Local Draft');
  192 |     await page.locator('#content').fill('This is a local-only entry.');
  193 |     await page.getByRole('button', { name: '保存' }).click();
  194 |     await page.waitForURL(`**#/diary/${localDate}`);
  195 | 
  196 |     // Go to diary list
  197 |     await page.click('a[href="#/diary"]');
  198 |     await page.waitForTimeout(500);
  199 | 
  200 |     // Should see BOTH entries
  201 |     const localEntry = page.locator(`a[href="#/diary/${localDate}"]`);
  202 |     const publishedEntry = page.locator('a[href="#/diary/2026-11-16"]');
  203 | 
  204 |     await expect(localEntry).toBeVisible();
> 205 |     await expect(publishedEntry).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  206 | 
  207 |     // Local entry should NOT have cloud badge
  208 |     // Published entry should have cloud badge
  209 |     // (checking by counting svg icons in each card)
  210 |   });
  211 | });
  212 | 
```