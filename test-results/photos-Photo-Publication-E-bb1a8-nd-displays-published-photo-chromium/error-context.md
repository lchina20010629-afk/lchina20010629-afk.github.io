# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photos.spec.ts >> Photo Publication End-to-End >> browser loads and displays published photo
- Location: e2e/photos.spec.ts:126:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.diary-images')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.diary-images') with timeout 5000ms
  - waiting for locator('.diary-images')

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
  - button "返回":
    - img
    - text: 返回
  - button "编辑":
    - img
    - text: 编辑
  - button "删除":
    - img
    - text: 删除
  - text: "2024-04-01 心情: happy 天气: sunny"
  - heading "测试照片日记" [level=1]
  - paragraph: 这是一篇包含照片的测试日记。
  - text: 测试 照片
  - paragraph: "📝 创建于: 2026/11/17 06:38:11"
```

# Test source

```ts
  72  |     const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  73  |     console.log(`Manifest entries: ${manifest.entries.length}`);
  74  |     
  75  |     // Find diary entry
  76  |     const diaryMeta = manifest.entries.find((e: any) => e.type === 'diary' && e.date === '2024-04-01');
  77  |     if (!diaryMeta) {
  78  |       throw new Error('Diary entry not in manifest');
  79  |     }
  80  |     
  81  |     console.log(`Diary has ${diaryMeta.attachments?.length || 0} attachments`);
  82  |     
  83  |     // Verify encrypted image exists
  84  |     if (diaryMeta.attachments && diaryMeta.attachments.length > 0) {
  85  |       const imagePath = join(TEST_DATA_DIR, diaryMeta.attachments[0].encryptedPath.replace('data/', ''));
  86  |       const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);
  87  |       console.log(`Encrypted image exists: ${imageExists}`);
  88  |       
  89  |       // Read and verify it's an encrypted envelope
  90  |       const encryptedImage = JSON.parse(await fs.readFile(imagePath, 'utf-8'));
  91  |       if (!encryptedImage.ciphertext || !encryptedImage.iv || !encryptedImage.authTag) {
  92  |         throw new Error('Image not properly encrypted');
  93  |       }
  94  |       console.log('✓ Image encrypted with AES-256-GCM');
  95  |     }
  96  |     
  97  |     // Verify original is unchanged
  98  |     const originalAfter = await sharp(join(TEST_DATA_DIR, 'test-photo-original.jpg')).metadata();
  99  |     console.log(`Original unchanged: width=${originalAfter.width}, height=${originalAfter.height}`);
  100 |   });
  101 |   
  102 |   test('CLI strips EXIF and encrypts image bytes', async () => {
  103 |     const manifest = JSON.parse(await fs.readFile(join(TEST_DATA_DIR, 'manifest.json'), 'utf-8'));
  104 |     const diaryMeta = manifest.entries.find((e: any) => e.type === 'diary');
  105 |     
  106 |     expect(diaryMeta).toBeDefined();
  107 |     expect(diaryMeta.attachments).toBeDefined();
  108 |     expect(diaryMeta.attachments.length).toBeGreaterThan(0);
  109 |     
  110 |     const attachment = diaryMeta.attachments[0];
  111 |     expect(attachment.id).toMatch(/^img_/);
  112 |     expect(attachment.type).toMatch(/^image\//);
  113 |     expect(attachment.encryptedPath).toContain('.enc');
  114 |     
  115 |     // Verify encrypted image file exists
  116 |     const imagePath = join(TEST_DATA_DIR, attachment.encryptedPath.replace('data/', ''));
  117 |     const encryptedImage = JSON.parse(await fs.readFile(imagePath, 'utf-8'));
  118 |     
  119 |     expect(encryptedImage.version).toBe('v1');
  120 |     expect(encryptedImage.algorithm).toBe('AES-256-GCM');
  121 |     expect(encryptedImage.ciphertext).toBeTruthy();
  122 |     expect(encryptedImage.iv).toBeTruthy();
  123 |     expect(encryptedImage.authTag).toBeTruthy();
  124 |   });
  125 |   
  126 |   test('browser loads and displays published photo', async ({ page }) => {
  127 |     // Build app and copy test data
  128 |     execSync('cd /agent/repos/lchina20010629-afk.github.io && npm run build', { stdio: 'inherit' });
  129 |     await fs.rm('/agent/repos/lchina20010629-afk.github.io/dist/data', { recursive: true, force: true });
  130 |     await fs.cp(TEST_DATA_DIR, '/agent/repos/lchina20010629-afk.github.io/dist/data', { recursive: true });
  131 |     
  132 |     // Start server (webServer config handles this)
  133 |     await page.goto('/#/settings');
  134 |     
  135 |     // Clear storage
  136 |     await page.evaluate(() => {
  137 |       localStorage.clear();
  138 |       sessionStorage.clear();
  139 |       indexedDB.databases().then(dbs => {
  140 |         dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
  141 |       });
  142 |     });
  143 |     
  144 |     // Initialize vault with test password
  145 |     await page.reload();
  146 |     await page.waitForTimeout(500);
  147 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  148 |     await page.waitForTimeout(200);
  149 |     await page.locator('#password').fill(TEST_PASSWORD);
  150 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  151 |     await page.getByRole('button', { name: '确认初始化' }).click();
  152 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  153 |     
  154 |     // Navigate to diary list
  155 |     await page.goto('/#/diary');
  156 |     await page.waitForTimeout(1000);
  157 |     
  158 |     // Should see published entry with cloud badge
  159 |     await expect(page.locator('a[href="#/diary/2024-04-01"]')).toBeVisible({ timeout: 10000 });
  160 |     await expect(page.locator('.published-badge').first()).toBeVisible();
  161 |     
  162 |     // Click to view detail
  163 |     await page.locator('a[href="#/diary/2024-04-01"]').click();
  164 |     await page.waitForTimeout(1000);
  165 |     
  166 |     // Verify diary content
  167 |     await expect(page.locator('text=测试照片日记')).toBeVisible({ timeout: 10000 });
  168 |     await expect(page.locator('text=这是一篇包含照片的测试日记')).toBeVisible();
  169 |     
  170 |     // Verify photo is displayed
  171 |     const imageContainer = page.locator('.diary-images');
> 172 |     await expect(imageContainer).toBeVisible({ timeout: 5000 });
      |                                  ^ Error: expect(locator).toBeVisible() failed
  173 |     
  174 |     const img = page.locator('.diary-images img').first();
  175 |     await expect(img).toBeVisible({ timeout: 5000 });
  176 |     
  177 |     // Verify image loaded (nonzero naturalWidth)
  178 |     const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
  179 |     expect(naturalWidth).toBeGreaterThan(0);
  180 |     console.log(`Photo naturalWidth: ${naturalWidth}`);
  181 |     
  182 |     // Verify blob URL format
  183 |     const imgSrc = await img.getAttribute('src');
  184 |     expect(imgSrc).toMatch(/^blob:/);
  185 |     console.log(`Blob URL: ${imgSrc?.substring(0, 30)}...`);
  186 |     
  187 |     // Take screenshots
  188 |     await page.screenshot({ path: '/opt/cursor/artifacts/photo-diary-desktop.png' });
  189 |     
  190 |     await page.setViewportSize({ width: 375, height: 812 });
  191 |     await page.waitForTimeout(500);
  192 |     await page.screenshot({ path: '/opt/cursor/artifacts/photo-diary-mobile.png' });
  193 |   });
  194 |   
  195 |   test('lock revokes blob URLs and removes images', async ({ page }) => {
  196 |     await page.goto('/#/settings');
  197 |     await page.evaluate(() => {
  198 |       localStorage.clear();
  199 |       sessionStorage.clear();
  200 |       indexedDB.databases().then(dbs => {
  201 |         dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
  202 |       });
  203 |     });
  204 |     await page.reload();
  205 |     await page.waitForTimeout(500);
  206 |     
  207 |     // Init and unlock
  208 |     await page.getByRole('button', { name: '初始化保险库' }).click();
  209 |     await page.waitForTimeout(200);
  210 |     await page.locator('#password').fill(TEST_PASSWORD);
  211 |     await page.locator('#confirm-password').fill(TEST_PASSWORD);
  212 |     await page.getByRole('button', { name: '确认初始化' }).click();
  213 |     await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
  214 |     
  215 |     // Go to diary with photo
  216 |     await page.goto('/#/diary/2024-04-01');
  217 |     await page.waitForTimeout(1000);
  218 |     
  219 |     // Verify photo is visible
  220 |     const img = page.locator('.diary-images img').first();
  221 |     await expect(img).toBeVisible({ timeout: 5000 });
  222 |     const blobUrlBefore = await img.getAttribute('src');
  223 |     expect(blobUrlBefore).toMatch(/^blob:/);
  224 |     
  225 |     // Lock vault
  226 |     await page.goto('/#/settings');
  227 |     await page.locator('button:has-text("锁定")').click();
  228 |     await page.waitForTimeout(500);
  229 |     
  230 |     // Navigate back to diary
  231 |     await page.goto('/#/diary/2024-04-01');
  232 |     await page.waitForTimeout(500);
  233 |     
  234 |     // Should show locked message
  235 |     await expect(page.locator('text=请先解锁保险库')).toBeVisible();
  236 |     
  237 |     // Image should NOT be visible
  238 |     await expect(page.locator('.diary-images')).not.toBeVisible();
  239 |   });
  240 | });
  241 | 
```