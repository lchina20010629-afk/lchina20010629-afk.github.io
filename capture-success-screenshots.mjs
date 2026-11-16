import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1080 } });
  
  const testPassword = 'TestPassword123!@#Strong';

  // Clean start
  await page.goto('http://localhost:4173/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload();

  console.log('1. Initializing vault...');
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill(testPassword);
  await page.locator('#confirm-password').fill(testPassword);
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  console.log('2. Creating diary entry with content...');
  await page.click('a[href="/diary"]');
  await page.waitForTimeout(300);
  await page.getByText('创建日记').click();
  await page.waitForSelector('#date');
  const today = new Date().toISOString().split('T')[0];
  await page.locator('#date').fill(today);
  await page.locator('#title').fill('我的成长日记 🌱');
  await page.locator('#content').fill(`今天学习了很多新知识：

1. WebCrypto API 加密技术
2. React 19 新特性  
3. TypeScript 类型系统进阶

收获很大！明天继续加油 💪`);
  await page.locator('#mood').fill('开心');
  await page.locator('#weather').fill('晴天');
  await page.locator('#tags').fill('学习, 成长, 编程');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForURL(`**/diary/${today}`);
  await page.waitForTimeout(500);

  console.log('3. Capturing diary detail screenshot...');
  await page.screenshot({ path: '/opt/cursor/artifacts/success-diary-detail-decrypted.png', fullPage: true });

  console.log('4. Navigating to diary list...');
  await page.click('a[href="/diary"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/success-diary-list.png', fullPage: true });

  console.log('5. Testing export...');
  await page.click('a[href="/settings"]');
  await page.waitForTimeout(300);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份' }).click();
  const download = await downloadPromise;
  const backupPath = '/tmp/success-backup.json';
  await download.saveAs(backupPath);
  await page.screenshot({ path: '/opt/cursor/artifacts/success-export-settings.png', fullPage: true });

  console.log('6. Clearing data and re-initializing...');
  await page.reload();
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();
  await page.click('a[href="/settings"]');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill(testPassword);
  await page.locator('#confirm-password').fill(testPassword);
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  console.log('7. Importing backup...');
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/opt/cursor/artifacts/success-import-complete.png', fullPage: true });

  console.log('8. Verifying imported data...');
  await page.click('a[href="/diary"]');
  await page.waitForTimeout(500);
  const dateLink = page.locator(`a[href="/diary/${today}"]`);
  await dateLink.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/success-restored-diary-detail.png', fullPage: true });

  console.log('\n✅ SUCCESS! Screenshots captured:');
  console.log('  - /opt/cursor/artifacts/success-diary-detail-decrypted.png');
  console.log('  - /opt/cursor/artifacts/success-diary-list.png');
  console.log('  - /opt/cursor/artifacts/success-export-settings.png');
  console.log('  - /opt/cursor/artifacts/success-import-complete.png');
  console.log('  - /opt/cursor/artifacts/success-restored-diary-detail.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
