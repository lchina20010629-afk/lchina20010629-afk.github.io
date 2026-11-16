import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
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
  await page.locator('#title').fill('My Test Title');
  await page.locator('#content').fill('Test content here.');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(1500);

  // Go to diary list
  await page.click('a[href="/diary"]');
  await page.waitForTimeout(500);

  const bodyText = await page.textContent('body');
  console.log('\n=== DIARY PAGE TEXT ===');
  console.log(bodyText);

  await page.waitForTimeout(3000);
  await browser.close();
})();
