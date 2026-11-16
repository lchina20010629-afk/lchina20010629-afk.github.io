#!/usr/bin/env node
/**
 * Create a test JPEG with synthetic EXIF GPS data for testing metadata stripping
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';

// Create a simple 100x100 red square
const width = 100;
const height = 100;
const channels = 3;
const imageData = Buffer.alloc(width * height * channels);

// Fill with red pixels
for (let i = 0; i < imageData.length; i += channels) {
  imageData[i] = 255;     // R
  imageData[i + 1] = 0;   // G
  imageData[i + 2] = 0;   // B
}

// Generate JPEG with minimal metadata (sharp will add some basic EXIF)
sharp(imageData, {
  raw: {
    width,
    height,
    channels,
  },
})
  .jpeg({
    quality: 90,
  })
  // Sharp doesn't support writing arbitrary GPS EXIF, so we'll create an image
  // that at least has some EXIF fields that can be tested for stripping
  .withMetadata({
    density: 72,
  })
  .toFile('/tmp/test-image-with-gps.jpg')
  .then(() => {
    console.log('✓ Created /tmp/test-image-with-gps.jpg with basic metadata');
    console.log('  (Note: Sharp cannot write GPS EXIF, but will have some metadata to test stripping)');
  })
  .catch(err => {
    console.error('Failed to create test image:', err);
    process.exit(1);
  });
