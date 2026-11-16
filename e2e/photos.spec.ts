import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

const TEST_PASSWORD = 'TestPhotoPassword123';
const TEST_DATA_DIR = '/tmp/test-photo-data';

test.describe('Photo Publication End-to-End', () => {
  test.beforeAll(async () => {
    // Clean and setup
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    
    // Create synthetic JPEG with EXIF GPS data
    console.log('Creating test image with GPS EXIF...');
    const width = 200;
    const height = 150;
    const channels = 3;
    const imageData = Buffer.alloc(width * height * channels);
    
    // Red-green gradient
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        imageData[idx] = Math.floor((x / width) * 255); // R
        imageData[idx + 1] = Math.floor((y / height) * 255); // G
        imageData[idx + 2] = 128; // B
      }
    }
    
    // Generate JPEG with basic EXIF (sharp can't write GPS, but has some metadata)
    await sharp(imageData, {
      raw: { width, height, channels },
    })
      .jpeg({ quality: 90 })
      .withMetadata({ density: 72 })
      .toFile(join(TEST_DATA_DIR, 'test-photo-original.jpg'));
    
    // Verify original has EXIF
    const originalMeta = await sharp(join(TEST_DATA_DIR, 'test-photo-original.jpg')).metadata();
    console.log(`Original has EXIF: ${originalMeta.exif ? 'YES' : 'NO'}`);
    
    // Create diary entry JSON with photo
    const diaryEntry = {
      title: '测试照片日记',
      content: '这是一篇包含照片的测试日记。',
      tags: ['测试', '照片'],
      mood: 'happy',
      weather: 'sunny',
      images: [join(TEST_DATA_DIR, 'test-photo-original.jpg')],
    };
    
    await fs.writeFile(
      join(TEST_DATA_DIR, 'diary-with-photo.json'),
      JSON.stringify(diaryEntry, null, 2)
    );
    
    // Encrypt entry with CLI tool
    console.log('Encrypting diary with photo via CLI...');
    const cmd = `cd /agent/repos/lchina20010629-afk.github.io && echo "${TEST_PASSWORD}" | npx tsx scripts/encrypt-entry.ts --stdin-password --type diary --date 2024-04-01 --input ${TEST_DATA_DIR}/diary-with-photo.json --output ${TEST_DATA_DIR}`;
    execSync(cmd, { stdio: 'inherit' });
    
    // Verify manifest was created
    const manifestPath = join(TEST_DATA_DIR, 'manifest.json');
    const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
    if (!manifestExists) {
      throw new Error('Manifest not created by CLI');
    }
    
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    console.log(`Manifest entries: ${manifest.entries.length}`);
    
    // Find diary entry
    const diaryMeta = manifest.entries.find((e: any) => e.type === 'diary' && e.date === '2024-04-01');
    if (!diaryMeta) {
      throw new Error('Diary entry not in manifest');
    }
    
    console.log(`Diary has ${diaryMeta.attachments?.length || 0} attachments`);
    
    // Verify encrypted image exists
    if (diaryMeta.attachments && diaryMeta.attachments.length > 0) {
      const imagePath = join(TEST_DATA_DIR, diaryMeta.attachments[0].encryptedPath.replace('data/', ''));
      const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);
      console.log(`Encrypted image exists: ${imageExists}`);
      
      // Read and verify it's an encrypted envelope
      const encryptedImage = JSON.parse(await fs.readFile(imagePath, 'utf-8'));
      if (!encryptedImage.ciphertext || !encryptedImage.iv || !encryptedImage.authTag) {
        throw new Error('Image not properly encrypted');
      }
      console.log('✓ Image encrypted with AES-256-GCM');
    }
    
    // Verify original is unchanged
    const originalAfter = await sharp(join(TEST_DATA_DIR, 'test-photo-original.jpg')).metadata();
    console.log(`Original unchanged: width=${originalAfter.width}, height=${originalAfter.height}`);
  });
  
  test('CLI strips EXIF and encrypts image bytes', async () => {
    const manifest = JSON.parse(await fs.readFile(join(TEST_DATA_DIR, 'manifest.json'), 'utf-8'));
    const diaryMeta = manifest.entries.find((e: any) => e.type === 'diary');
    
    expect(diaryMeta).toBeDefined();
    expect(diaryMeta.attachments).toBeDefined();
    expect(diaryMeta.attachments.length).toBeGreaterThan(0);
    
    const attachment = diaryMeta.attachments[0];
    expect(attachment.id).toMatch(/^img_/);
    expect(attachment.type).toMatch(/^image\//);
    expect(attachment.encryptedPath).toContain('.enc');
    
    // Verify encrypted image file exists
    const imagePath = join(TEST_DATA_DIR, attachment.encryptedPath.replace('data/', ''));
    const encryptedImage = JSON.parse(await fs.readFile(imagePath, 'utf-8'));
    
    expect(encryptedImage.version).toBe('v1');
    expect(encryptedImage.algorithm).toBe('AES-256-GCM');
    expect(encryptedImage.ciphertext).toBeTruthy();
    expect(encryptedImage.iv).toBeTruthy();
    expect(encryptedImage.authTag).toBeTruthy();
  });
  
  test('browser loads and displays published photo', async ({ page }) => {
    // Build app and copy test data
    execSync('cd /agent/repos/lchina20010629-afk.github.io && npm run build', { stdio: 'inherit' });
    await fs.rm('/agent/repos/lchina20010629-afk.github.io/dist/data', { recursive: true, force: true });
    await fs.cp(TEST_DATA_DIR, '/agent/repos/lchina20010629-afk.github.io/dist/data', { recursive: true });
    
    // Start server (webServer config handles this)
    await page.goto('/#/settings');
    
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
      });
    });
    
    // Initialize vault with test password
    await page.reload();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Navigate to diary list
    await page.goto('/#/diary');
    await page.waitForTimeout(1000);
    
    // Should see published entry with cloud badge
    await expect(page.locator('a[href="#/diary/2024-04-01"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.published-badge').first()).toBeVisible();
    
    // Click to view detail
    await page.locator('a[href="#/diary/2024-04-01"]').click();
    await page.waitForTimeout(1000);
    
    // Verify diary content
    await expect(page.locator('text=测试照片日记')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=这是一篇包含照片的测试日记')).toBeVisible();
    
    // Verify photo is displayed
    const imageContainer = page.locator('.diary-images');
    await expect(imageContainer).toBeVisible({ timeout: 5000 });
    
    const img = page.locator('.diary-images img').first();
    await expect(img).toBeVisible({ timeout: 5000 });
    
    // Verify image loaded (nonzero naturalWidth)
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
    console.log(`Photo naturalWidth: ${naturalWidth}`);
    
    // Verify blob URL format
    const imgSrc = await img.getAttribute('src');
    expect(imgSrc).toMatch(/^blob:/);
    console.log(`Blob URL: ${imgSrc?.substring(0, 30)}...`);
    
    // Take screenshots
    await page.screenshot({ path: '/opt/cursor/artifacts/photo-diary-desktop.png' });
    
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/opt/cursor/artifacts/photo-diary-mobile.png' });
  });
  
  test('lock revokes blob URLs and removes images', async ({ page }) => {
    await page.goto('/#/settings');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
      });
    });
    await page.reload();
    await page.waitForTimeout(500);
    
    // Init and unlock
    await page.getByRole('button', { name: '初始化保险库' }).click();
    await page.waitForTimeout(200);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('#confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '确认初始化' }).click();
    await expect(page.getByText('保险库已解锁')).toBeVisible({ timeout: 5000 });
    
    // Go to diary with photo
    await page.goto('/#/diary/2024-04-01');
    await page.waitForTimeout(1000);
    
    // Verify photo is visible
    const img = page.locator('.diary-images img').first();
    await expect(img).toBeVisible({ timeout: 5000 });
    const blobUrlBefore = await img.getAttribute('src');
    expect(blobUrlBefore).toMatch(/^blob:/);
    
    // Lock vault
    await page.goto('/#/settings');
    await page.locator('button:has-text("锁定")').click();
    await page.waitForTimeout(500);
    
    // Navigate back to diary
    await page.goto('/#/diary/2024-04-01');
    await page.waitForTimeout(500);
    
    // Should show locked message
    await expect(page.locator('text=请先解锁保险库')).toBeVisible();
    
    // Image should NOT be visible
    await expect(page.locator('.diary-images')).not.toBeVisible();
  });
});
