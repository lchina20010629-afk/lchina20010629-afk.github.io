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

  // Init and wait
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.getByRole('button', { name: '确认初始化' }).click();
  
  // Wait for unlock confirmation
  await page.waitForSelector('text=保险库已解锁', { timeout: 5000 });
  console.log('✓ Vault unlocked');

  // Now navigate to diary
  await page.goto('http://localhost:5173/diary');
  
  // Check if we can see the create button
  const createBtn = await page.locator('text=创建日记').count();
  console.log('Create button visible on /diary:', createBtn > 0);
  
  if (createBtn === 0) {
    const lockedMsg = await page.locator('text=保险库已锁定').count();
    console.log('Shows locked message:', lockedMsg > 0);
  }

  // Navigate directly to create
  await page.goto('http://localhost:5173/diary/create');
  await page.waitForTimeout(500);
  
  const hasForm = await page.locator('#date').count();
  const hasLockedMsg = await page.locator('text=请先解锁保险库').count();
  console.log('On /diary/create:');
  console.log('  Has form (#date):', hasForm > 0);
  console.log('  Has locked message:', hasLockedMsg > 0);

  await page.waitForTimeout(3000);
  await browser.close();
})();
