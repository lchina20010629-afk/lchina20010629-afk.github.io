import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Clear storage
  await page.goto('http://localhost:5173');
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
    localStorage.clear();
    sessionStorage.clear();
  });

  // Settings uninitialized
  await page.goto('http://localhost:5173/settings');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/01-settings-uninitialized-desktop.png', fullPage: true });

  // Initialize vault
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.waitForTimeout(300);
  await page.locator('#password').fill('TestPassword123!@#Strong');
  await page.locator('#confirm-password').fill('TestPassword123!@#Strong');
  await page.screenshot({ path: '/opt/cursor/artifacts/02-vault-init-form-desktop.png', fullPage: true });
  
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/opt/cursor/artifacts/03-vault-unlocked-desktop.png', fullPage: true });

  // Dashboard
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/04-dashboard-desktop.png', fullPage: true });

  // Diary empty
  await page.goto('http://localhost:5173/diary');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/05-diary-empty-desktop.png', fullPage: true });

  // Learning page
  await page.goto('http://localhost:5173/learning');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/06-learning-desktop.png', fullPage: true });

  // Mobile viewport - dashboard
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/07-dashboard-mobile.png', fullPage: true });

  // Mobile diary
  await page.goto('http://localhost:5173/diary');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/08-diary-mobile.png', fullPage: true });

  // Mobile settings
  await page.goto('http://localhost:5173/settings');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/09-settings-mobile.png', fullPage: true });

  console.log('✅ Screenshots saved successfully');
  await browser.close();
})();
