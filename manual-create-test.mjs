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

  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(1500);

  await page.goto('http://localhost:5173/diary');
  await page.waitForTimeout(500);
  
  // Try direct navigation instead
  console.log('Navigating directly to /diary/create');
  await page.goto('http://localhost:5173/diary/create');
  await page.waitForTimeout(1000);
  console.log('URL after direct nav:', page.url());
  
  const hasDateInput = await page.locator('#date').count();
  console.log('Has #date input:', hasDateInput);
  
  await page.waitForTimeout(3000);
  await browser.close();
})();
