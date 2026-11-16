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
  console.log('Initializing vault...');
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill(testPassword);
  await page.locator('#confirm-password').fill(testPassword);
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForSelector('text=保险库已解锁');

  // Create first entry
  console.log('Creating first entry...');
  await page.click('a[href="/diary"]');
  await page.waitForTimeout(200);
  await page.getByText('创建日记').click();
  const today = new Date().toISOString().split('T')[0];
  await page.locator('#date').fill(today);
  await page.locator('#title').fill('Existing Entry');
  await page.locator('#content').fill('Original content.');
  await page.getByRole('button', { name: '保存' }).click();
  
  // Wait for navigation
  await page.waitForURL(`**/diary/${today}`, { timeout: 5000 });
  await page.waitForTimeout(500);

  console.log('Current URL:', page.url());
  console.log('Navigating to settings...');
  
  // Navigate to settings
  await page.click('a[href="/settings"]');
  await page.waitForTimeout(500);
  
  console.log('Current URL after nav:', page.url());
  
  // Check if export button is visible
  const exportButton = page.getByRole('button', { name: '导出备份' });
  const isVisible = await exportButton.isVisible().catch(() => false);
  console.log('Export button visible:', isVisible);
  
  if (!isVisible) {
    const bodyText = await page.textContent('body');
    console.log('Page body contains 保险库已解锁:', bodyText.includes('保险库已解锁'));
    console.log('Page body contains 导出备份:', bodyText.includes('导出备份'));
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/debug-preserve.png' });
    console.log('Screenshot saved to /tmp/debug-preserve.png');
  } else {
    console.log('✅ Export button is visible!');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
