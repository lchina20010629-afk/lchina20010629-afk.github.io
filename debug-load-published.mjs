import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Clear storage
  await page.goto('http://localhost:8174/#/settings');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    localStorage.clear();
    sessionStorage.clear();
  });
  
  await page.reload();
  
  // Initialize vault
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestFixturePassword123');
  await page.locator('#confirm-password').fill('TestFixturePassword123');
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(500);
  
  console.log('Vault initialized');
  
  // Navigate to diary
  await page.click('a[href="#/diary"]');
  await page.waitForTimeout(500);
  
  const diaryLink = page.locator('a[href="#/diary/2026-11-16"]');
  const count = await diaryLink.count();
  console.log('Diary entry link count:', count);
  
  if (count > 0) {
    await diaryLink.click();
    await page.waitForTimeout(2000);
    
    const bodyText = await page.textContent('body');
    console.log('\n=== Page content (first 800 chars) ===');
    console.log(bodyText.substring(0, 800));
    
    await page.screenshot({ path: '/tmp/debug-published-load.png' });
    console.log('\nScreenshot: /tmp/debug-published-load.png');
  } else {
    console.log('Entry link not found!');
  }
  
  await browser.close();
})();
