import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testPassword = 'TestPassword123!@#Strong';

  await page.goto('http://localhost:5173/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();

  // Init
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill(testPassword);
  await page.locator('#confirm-password').fill(testPassword);
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  // Create entry
  await page.click('a[href="/diary"]');
  await page.waitForTimeout(200);
  await page.getByText('创建日记').click();
  await page.waitForSelector('#date');
  const today = new Date().toISOString().split('T')[0];
  await page.locator('#date').fill(today);
  await page.locator('#title').fill('Test Export Entry');
  await page.locator('#content').fill('Content for export test.');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(1500);

  // Check what's in IndexedDB before export
  const dbBefore = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('life-growth-db');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction('diaryDrafts', 'readonly');
    const all = await new Promise((resolve) => {
      const req = tx.objectStore('diaryDrafts').getAll();
      req.onsuccess = () => resolve(req.result);
    });
    return JSON.stringify(all, null, 2);
  });
  console.log('=== DB BEFORE EXPORT ===');
  console.log(dbBefore);

  // Export
  await page.click('a[href="/settings"]');
  await page.waitForTimeout(200);
  const downloadPromise = context.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份' }).click();
  const download = await downloadPromise;
  const path = '/tmp/test-backup.json';
  await download.saveAs(path);
  console.log('\n=== EXPORTED ===');

  // Clear and re-init
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

  // Import
  await page.locator('input[type="file"]').setInputFiles(path);
  await page.waitForTimeout(2000);
  
  const successMsg = await page.locator('text=/导入成功/').count();
  console.log('\n=== IMPORT SUCCESS MSG:', successMsg > 0);

  // Check DB after import
  const dbAfter = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('life-growth-db');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction('diaryDrafts', 'readonly');
    const all = await new Promise((resolve) => {
      const req = tx.objectStore('diaryDrafts').getAll();
      req.onsuccess = () => resolve(req.result);
    });
    return JSON.stringify(all, null, 2);
  });
  console.log('\n=== DB AFTER IMPORT ===');
  console.log(dbAfter);

  await page.waitForTimeout(3000);
  await browser.close();
})();
