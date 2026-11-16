import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    localStorage.clear();
  });
  await page.reload();

  // Init vault
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(1000);

  // Go to diary
  await page.goto('http://localhost:5173/diary');
  await page.waitForTimeout(500);
  
  console.log('Page URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Try to find the create button
  const createButton = await page.getByText('创建日记').count();
  console.log('Create button count:', createButton);
  
  if (createButton > 0) {
    console.log('Create button visible:', await page.getByText('创建日记').isVisible());
    await page.getByText('创建日记').click();
    await page.waitForTimeout(1000);
    console.log('After click URL:', page.url());
  }
  
  await page.screenshot({ path: '/tmp/diary-nav-debug.png' });
  await page.waitForTimeout(5000);
  await browser.close();
})();
