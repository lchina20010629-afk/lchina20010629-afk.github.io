import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to hash route...');
  await page.goto('http://localhost:8174/#/settings');
  await page.waitForTimeout(2000);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const bodyText = await page.textContent('body');
  console.log('Body text (first 500 chars):', bodyText.substring(0, 500));
  
  const links = await page.locator('a').count();
  console.log('Number of links:', links);
  
  if (links > 0) {
    for (let i = 0; i < Math.min(5, links); i++) {
      const href = await page.locator('a').nth(i).getAttribute('href');
      const text = await page.locator('a').nth(i).textContent();
      console.log(`Link ${i}: href="${href}" text="${text}"`);
    }
  }
  
  await page.screenshot({ path: '/tmp/page-load-check.png' });
  console.log('Screenshot saved to /tmp/page-load-check.png');
  
  await browser.close();
})();
