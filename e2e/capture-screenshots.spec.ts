import { test } from '@playwright/test';

const TEST_PASSWORD = 'TestPass123!';

test('capture course and review UI screenshots', async ({ page }) => {
  // Init vault
  await page.goto('http://localhost:5173/');
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  await page.locator('button:has-text("初始化保险库")').click();
  await page.waitForTimeout(1000);
  
  // Dashboard
  await page.screenshot({ path: '/opt/cursor/artifacts/01-dashboard-desktop.png', fullPage: true });
  
  // Navigate to Learning
  await page.goto('http://localhost:5173/#/learning');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/02-learning-list-desktop.png', fullPage: true });
  
  // Create today's course record
  const today = new Date().toISOString().split('T')[0];
  await page.goto(`http://localhost:5173/#/learning/${today}`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/opt/cursor/artifacts/03-course-detail-desktop.png', fullPage: true });
  
  // Navigate to Reviews
  await page.goto('http://localhost:5173/#/reviews');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/04-reviews-list-desktop.png', fullPage: true });
  
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('http://localhost:5173/#/learning');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/05-learning-list-mobile.png', fullPage: true });
  
  await page.goto(`http://localhost:5173/#/learning/${today}`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/opt/cursor/artifacts/06-course-detail-mobile.png', fullPage: true });
  
  await page.goto('http://localhost:5173/#/reviews');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/opt/cursor/artifacts/07-reviews-list-mobile.png', fullPage: true });
});
