import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Inject debugging
  await page.addInitScript(() => {
    const originalLog = console.log;
    window.vaultStateChanges = [];
    console.log = function(...args) {
      if (args[0]?.includes?.('Vault') || args[0]?.includes?.('unlock')) {
        window.vaultStateChanges.push(args.join(' '));
      }
      originalLog.apply(console, args);
    };
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

  // Check localStorage/sessionStorage for any vault state
  const storage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  console.log('Storage after init:', JSON.stringify(storage, null, 2));

  await page.goto('http://localhost:5173/diary/create');
  await page.waitForTimeout(1000);

  const storageAfterNav = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  console.log('Storage after nav:', JSON.stringify(storageAfterNav, null, 2));

  await page.waitForTimeout(3000);
  await browser.close();
})();
