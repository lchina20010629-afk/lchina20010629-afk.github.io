import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

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
  await page.waitForTimeout(1000);

  await page.goto('http://localhost:5173/diary');
  await page.waitForTimeout(500);
  
  // Click with navigation wait
  await Promise.all([
    page.waitForNavigation({ timeout: 5000 }).catch(() => console.log('No navigation occurred')),
    page.click('a.btn-primary'),
  ]);
  
  console.log('Final URL:', page.url());
  await page.waitForTimeout(3000);
  await browser.close();
})();
