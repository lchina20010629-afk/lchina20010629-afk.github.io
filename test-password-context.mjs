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

  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  // Check sessionStorage
  const session1 = await page.evaluate(() => sessionStorage.getItem('vault_session_pwd'));
  console.log('Session password after init:', session1 ? 'SET' : 'NOT SET');

  // Create diary
  await page.goto('http://localhost:5173/diary/create');
  await page.waitForSelector('#date');
  await page.locator('#date').fill(new Date().toISOString().split('T')[0]);
  await page.locator('#title').fill('Test');
  await page.locator('#content').fill('Content');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(2000);

  // Go back to settings
  await page.goto('http://localhost:5173/settings');
  await page.waitForTimeout(1000);
  
  const session2 = await page.evaluate(() => sessionStorage.getItem('vault_session_pwd'));
  console.log('Session password after navigation:', session2 ? 'SET' : 'NOT SET');
  
  // Check if export button is enabled
  const exportBtn = page.getByRole('button', { name: '导出备份' });
  const isDisabled = await exportBtn.getAttribute('disabled');
  console.log('Export button disabled:', isDisabled !== null);
  
  // Try to click and see what happens
  await exportBtn.click();
  await page.waitForTimeout(1000);
  
  // Check for error
  const errorCount = await page.locator('.alert-error').count();
  if (errorCount > 0) {
    const errorText = await page.locator('.alert-error').textContent();
    console.log('Error:', errorText);
  } else {
    console.log('No error shown');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
