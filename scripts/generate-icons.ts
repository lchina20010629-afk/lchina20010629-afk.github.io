#!/usr/bin/env node
/**
 * Generate PWA icons from SVG source
 * Creates all required sizes including maskable variants for Android
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

// Simple SVG icon (green leaf representing growth)
const SVG_ICON = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#FAF9F6"/>
  <g transform="translate(256,256)">
    <!-- Leaf stem -->
    <rect x="-8" y="50" width="16" height="150" rx="8" fill="#6A9557"/>
    
    <!-- Leaf shape (growth symbol) -->
    <path d="M -120,-50 Q -150,-120 -80,-180 Q -40,-200 0,-180 Q 40,-200 80,-180 Q 150,-120 120,-50 Q 100,0 0,80 Q -100,0 -120,-50 Z" 
          fill="#7FB069" stroke="#6A9557" stroke-width="4"/>
    
    <!-- Leaf vein -->
    <path d="M 0,-160 L 0,80" 
          stroke="#6A9557" stroke-width="3" fill="none" opacity="0.6"/>
    
    <!-- Side veins -->
    <path d="M -5,-100 Q -40,-80 -60,-50" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M 5,-100 Q 40,-80 60,-50" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M -5,-40 Q -50,-10 -70,20" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M 5,-40 Q 50,-10 70,20" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.4"/>
  </g>
</svg>
`.trim();

// Maskable variant (80% safe zone)
const SVG_MASKABLE = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#7FB069"/>
  <g transform="translate(256,256) scale(0.65)">
    <!-- Leaf stem -->
    <rect x="-8" y="50" width="16" height="150" rx="8" fill="#F5F4F1"/>
    
    <!-- Leaf shape (growth symbol) -->
    <path d="M -120,-50 Q -150,-120 -80,-180 Q -40,-200 0,-180 Q 40,-200 80,-180 Q 150,-120 120,-50 Q 100,0 0,80 Q -100,0 -120,-50 Z" 
          fill="#FAF9F6" stroke="#F5F4F1" stroke-width="4"/>
    
    <!-- Leaf vein -->
    <path d="M 0,-160 L 0,80" 
          stroke="#6A9557" stroke-width="3" fill="none" opacity="0.7"/>
    
    <!-- Side veins -->
    <path d="M -5,-100 Q -40,-80 -60,-50" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M 5,-100 Q 40,-80 60,-50" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M -5,-40 Q -50,-10 -70,20" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M 5,-40 Q 50,-10 70,20" 
          stroke="#6A9557" stroke-width="2" fill="none" opacity="0.5"/>
  </g>
</svg>
`.trim();

async function generateIcons() {
  const outputDir = 'public/icons';
  await mkdir(outputDir, { recursive: true });

  console.log('🎨 Generating PWA icons...\n');

  // Generate standard icons
  for (const size of ICON_SIZES) {
    const output = join(outputDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(SVG_ICON))
      .resize(size, size)
      .png()
      .toFile(output);
    console.log(`✓ Generated ${size}x${size} icon`);
  }

  // Generate maskable icons
  for (const size of MASKABLE_SIZES) {
    const output = join(outputDir, `icon-${size}x${size}-maskable.png`);
    await sharp(Buffer.from(SVG_MASKABLE))
      .resize(size, size)
      .png()
      .toFile(output);
    console.log(`✓ Generated ${size}x${size} maskable icon`);
  }

  // Generate Apple Touch Icon (180x180)
  const appleTouchOutput = join(outputDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(SVG_ICON))
    .resize(180, 180)
    .png()
    .toFile(appleTouchOutput);
  console.log(`✓ Generated Apple Touch Icon (180x180)`);

  // Generate favicon
  const faviconOutput = join(outputDir, 'favicon.ico');
  const favicon32 = await sharp(Buffer.from(SVG_ICON))
    .resize(32, 32)
    .png()
    .toBuffer();
  await writeFile(faviconOutput, favicon32);
  console.log(`✓ Generated favicon.ico`);

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
