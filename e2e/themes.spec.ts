import { test, expect, Page } from '@playwright/test';

const TEST_PASSWORD = 'TestPass123!';

// Test on multiple viewports
const viewports = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

const palettes = ['cream-green', 'fresh-blue', 'warm-apricot', 'light-purple'] as const;
const modes = ['light', 'dark'] as const;

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/settings');
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('should load with default cream-green palette', async ({ page }) => {
    const paletteAttr = await page.evaluate(() => 
      document.documentElement.getAttribute('data-palette')
    );
    expect(paletteAttr).toBe('cream-green');
  });

  test('should switch between palettes', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForTimeout(500);
    
    // Test each palette
    for (const palette of palettes) {
      const paletteCard = page.locator(`.palette-card[data-palette="${palette}"]`);
      await paletteCard.click();
      await page.waitForTimeout(200);
      
      // Verify DOM attribute updated
      const currentPalette = await page.evaluate(() => 
        document.documentElement.getAttribute('data-palette')
      );
      expect(currentPalette).toBe(palette);
      
      // Verify active class
      await expect(paletteCard).toHaveClass(/active/);
    }
  });

  test('should switch between light and dark modes', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForTimeout(500);
    
    // Click dark mode button
    await page.getByRole('button', { name: /深色/ }).click();
    await page.waitForTimeout(200);
    
    let themeAttr = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    expect(themeAttr).toBe('dark');
    
    // Click light mode button
    await page.getByRole('button', { name: /浅色/ }).click();
    await page.waitForTimeout(200);
    
    themeAttr = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    expect(themeAttr).toBe('light');
  });

  test('should persist palette selection after reload', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForTimeout(500);
    
    // Select light-purple palette
    await page.locator('.palette-card[data-palette="light-purple"]').click();
    await page.waitForTimeout(200);
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(500);
    
    // Verify palette persisted
    const paletteAttr = await page.evaluate(() => 
      document.documentElement.getAttribute('data-palette')
    );
    expect(paletteAttr).toBe('light-purple');
    
    // Verify active state
    await expect(page.locator('.palette-card[data-palette="light-purple"]')).toHaveClass(/active/);
  });

  test('should not lose vault state when switching themes', async ({ page }) => {
    // Initialize vault
    await page.goto('/#/settings');
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Switch palette
    await page.locator('.palette-card[data-palette="fresh-blue"]').click();
    await page.waitForTimeout(200);
    
    // Verify vault still unlocked
    await expect(page.getByText('保险库已解锁')).toBeVisible();
    
    // Switch theme mode
    await page.getByRole('button', { name: /深色/ }).click();
    await page.waitForTimeout(200);
    
    // Verify vault still unlocked
    await expect(page.getByText('保险库已解锁')).toBeVisible();
  });
});

test.describe('Mobile Responsive', () => {
  for (const viewport of viewports) {
    test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('/#/');
      await page.waitForTimeout(1000);
      
      // Check no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
      
      // Check all pages are accessible
      const pages = [
        { path: '/#/', title: '今日总览' },
        { path: '/#/diary', title: '生活日记' },
        { path: '/#/learning', title: '成长学习' },
        { path: '/#/reviews', title: '复盘反思' },
        { path: '/#/settings', title: '设置' },
      ];
      
      for (const { path, title } of pages) {
        await page.goto(path);
        await page.waitForTimeout(1000);
        
        // Verify page loaded - look for specific h1 in main content
        const mainH1 = page.locator('main h1, .page-header h1').first();
        await expect(mainH1).toBeVisible({ timeout: 5000 });
        
        // Check no horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(overflow).toBe(false);
      }
    });
  }
});

test.describe('Theme Screenshots', () => {
  for (const palette of palettes) {
    for (const mode of modes) {
      test(`should capture ${palette}-${mode} at mobile width`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Set theme
        await page.goto('/#/settings');
        await page.waitForTimeout(500);
        
        // Set palette
        await page.locator(`.palette-card[data-palette="${palette}"]`).click();
        await page.waitForTimeout(200);
        
        // Set mode
        const modeButton = mode === 'light' 
          ? page.getByRole('button', { name: /浅色/ })
          : page.getByRole('button', { name: /深色/ });
        await modeButton.click();
        await page.waitForTimeout(200);
        
        // Go to homepage and capture
        await page.goto('/#/');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `/opt/cursor/artifacts/theme-${palette}-${mode}-mobile.png`,
          fullPage: false
        });
      });
    }
  }
  
  test('should capture desktop view with all palettes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    for (const palette of palettes) {
      await page.goto('/#/settings');
      await page.waitForTimeout(500);
      
      await page.locator(`.palette-card[data-palette="${palette}"]`).click();
      await page.waitForTimeout(200);
      
      await page.goto('/#/');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `/opt/cursor/artifacts/theme-${palette}-light-desktop.png`,
        fullPage: false
      });
    }
  });
});

test.describe('Touch Targets', () => {
  test('should have minimum 44px touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/');
    await page.waitForTimeout(1000);
    
    // Check navigation buttons
    const navButtons = page.locator('nav button, nav a');
    const count = await navButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Dark Mode Contrast', () => {
  test('should have readable text in dark mode', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForTimeout(500);
    
    // Switch to dark mode
    await page.getByRole('button', { name: /深色/ }).click();
    await page.waitForTimeout(200);
    
    // Check various text elements are visible
    await page.goto('/#/');
    await page.waitForTimeout(1000);
    
    const mainH1 = page.locator('main h1, .page-header h1').first();
    await expect(mainH1).toBeVisible();
    await expect(page.getByText('生活日记')).toBeVisible();
    await expect(page.getByText('成长学习')).toBeVisible();
    
    // Verify dark theme attribute is set
    const themeAttr = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    expect(themeAttr).toBe('dark');
    
    // Verify dark background color is applied (should have low RGB values)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).backgroundColor;
    });
    
    // Background should be dark (RGB values less than 100)
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      expect(Math.max(r, g, b)).toBeLessThan(100);
    }
  });
});
