import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Clear storage
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Navigate to settings
  await page.goto('http://localhost:5173/settings');
  await page.screenshot({ path: '/opt/cursor/artifacts/01-settings-uninitialized-desktop.png', fullPage: true });

  // Initialize vault
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.screenshot({ path: '/opt/cursor/artifacts/02-vault-init-form-desktop.png', fullPage: true });
  
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/opt/cursor/artifacts/03-vault-unlocked-desktop.png', fullPage: true });

  // Go to diary and create entry
  await page.goto('http://localhost:5173/diary');
  await page.screenshot({ path: '/opt/cursor/artifacts/04-diary-empty-desktop.png', fullPage: true });

  await page.getByText('创建日记').click();
  await page.waitForSelector('#date');
  
  const today = new Date().toISOString().split('T')[0];
  await page.locator('#date').fill(today);
  await page.locator('#title').fill('我的第一篇日记 🌟');
  await page.locator('#content').fill('今天天气很好，心情也不错。\n这是第二行内容。\n包含中文、emoji 😊 和 English mixed text.');
  await page.locator('#mood').fill('开心');
  await page.locator('#weather').fill('晴天');
  await page.locator('#tags').fill('测试, 心情, Unicode');
  
  await page.screenshot({ path: '/opt/cursor/artifacts/05-diary-create-filled-desktop.png', fullPage: true });
  
  await page.getByText('保存').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/opt/cursor/artifacts/06-diary-detail-view-desktop.png', fullPage: true });

  // Test export
  await page.goto('http://localhost:5173/settings');
  await page.screenshot({ path: '/opt/cursor/artifacts/07-settings-with-backup-desktop.png', fullPage: true });

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: '/opt/cursor/artifacts/08-dashboard-mobile.png', fullPage: true });

  await page.goto('http://localhost:5173/diary');
  await page.screenshot({ path: '/opt/cursor/artifacts/09-diary-list-mobile.png', fullPage: true });

  await page.goto('http://localhost:5173/settings');
  await page.screenshot({ path: '/opt/cursor/artifacts/10-settings-mobile.png', fullPage: true });

  console.log('Screenshots saved successfully');
  await browser.close();
})();
