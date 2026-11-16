import { test } from '@playwright/test';

const TEST_PASSWORD = 'TestPass123!';

test('capture desktop screenshots', async ({ page, context }) => {
  await context.setViewportSize({ width: 1920, height: 1080 });
  
  // Initialize vault
  await page.goto('http://localhost:8175/#/settings');
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.waitForTimeout(200);
  await page.locator('#password').fill(TEST_PASSWORD);
  await page.locator('#confirm-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(2000);
  
  // Capture Course Detail
  await page.goto('http://localhost:8175/#/learning/2024-03-16');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/opt/cursor/artifacts/course-detail-desktop.png', fullPage: true });
  
  // Capture Review Detail
  await page.goto('http://localhost:8175/#/reviews/weekly/2024-W11');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/opt/cursor/artifacts/review-detail-desktop.png', fullPage: true });
});

test('capture mobile screenshots', async ({ page, context }) => {
  await context.setViewportSize({ width: 375, height: 667 });
  
  // Initialize vault
  await page.goto('http://localhost:8175/#/settings');
  await page.getByRole('button', { name: '初始化保险库' }).click();
  await page.waitForTimeout(200);
  await page.locator('#password').fill(TEST_PASSWORD);
  await page.locator('#confirm-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: '确认初始化' }).click();
  await page.waitForTimeout(2000);
  
  // Capture Course Detail
  await page.goto('http://localhost:8175/#/learning/2024-03-16');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/opt/cursor/artifacts/course-detail-mobile.png', fullPage: true });
  
  // Capture Review Detail
  await page.goto('http://localhost:8175/#/reviews/weekly/2024-W11');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/opt/cursor/artifacts/review-detail-mobile.png', fullPage: true });
});
