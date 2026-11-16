import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:5173/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();

  // Init
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  // Create a diary entry
  await page.goto('http://localhost:5173/diary/create');
  await page.waitForSelector('#date');
  const today = new Date().toISOString().split('T')[0];
  await page.locator('#date').fill(today);
  await page.locator('#title').fill('Test');
  await page.locator('#content').fill('Content');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForURL(`**/diary/${today}`);

  // Go to settings and try export
  await page.goto('http://localhost:5173/settings');
  await page.waitForTimeout(500);
  
  const exportBtn = await page.getByRole('button', { name: '导出备份' }).count();
  console.log('Export button count:', exportBtn);
  
  if (exportBtn > 0) {
    console.log('Clicking export...');
    page.once('download', download => {
      console.log('Download triggered:', download.suggestedFilename());
    });
    await page.getByRole('button', { name: '导出备份' }).click();
    await page.waitForTimeout(3000);
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
