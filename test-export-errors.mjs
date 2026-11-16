import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}]`, text);
  });
  
  // Capture errors
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
    console.log(err.stack);
  });

  await page.goto('http://localhost:5173/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();

  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  await page.goto('http://localhost:5173/diary/create');
  await page.waitForSelector('#date');
  await page.locator('#date').fill(new Date().toISOString().split('T')[0]);
  await page.locator('#title').fill('Test');
  await page.locator('#content').fill('Content');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5173/settings');
  await page.waitForTimeout(500);
  
  console.log('\n=== Clicking export button ===');
  const downloadPromise = context.waitForEvent('download', { timeout: 3000 }).catch(() => null);
  await page.getByRole('button', { name: '导出备份' }).click();
  
  await page.waitForTimeout(2000);
  const download = await downloadPromise;
  
  if (download) {
    console.log('✓ Download successful:', download.suggestedFilename());
  } else {
    console.log('✗ No download event fired');
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
