import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('http://localhost:5173/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();

  // Init and create entry
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
  
  console.log('Attempting export with download listener...');
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.getByRole('button', { name: '导出备份' }).click();
  const download = await downloadPromise;
  
  if (download) {
    console.log('✓ Download successful:', download.suggestedFilename());
  } else {
    console.log('✗ No download triggered');
    
    // Check if there's an error message on page
    const errorMsg = await page.locator('.alert-error').count();
    if (errorMsg > 0) {
      const errorText = await page.locator('.alert-error').textContent();
      console.log('Error on page:', errorText);
    }
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
