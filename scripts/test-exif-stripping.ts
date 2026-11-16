#!/usr/bin/env node
/**
 * Test EXIF/GPS stripping functionality
 */

import sharp from 'sharp';

async function testExifStripping() {
  console.log('🧪 Testing EXIF/GPS metadata stripping...\n');
  
  // Check original image
  console.log('1. Checking original test image with GPS...');
  const originalPath = '/tmp/test-image-with-gps.jpg';
  try {
    const originalMetadata = await sharp(originalPath).metadata();
    console.log('   ✓ Original image loaded');
    console.log(`   - Has EXIF: ${originalMetadata.exif ? 'YES' : 'NO'}`);
    console.log(`   - Has XMP: ${originalMetadata.xmp ? 'YES' : 'NO'}`);
    console.log(`   - Has ICC: ${originalMetadata.icc ? 'YES' : 'NO'}`);
    
    if (originalMetadata.exif) {
      // Parse EXIF to check for GPS
      const exifBuffer = originalMetadata.exif;
      const exifStr = exifBuffer.toString('latin1');
      const hasGPS = exifStr.includes('GPS') || exifStr.includes('LatitudeRef');
      console.log(`   - Contains GPS data: ${hasGPS ? 'YES (expected)' : 'NO (unexpected!)'}`);
    }
  } catch (err) {
    console.error(`   ✗ Failed to read original: ${err}`);
    return false;
  }
  
  // Strip metadata
  console.log('\n2. Stripping metadata with sharp...');
  try {
    // Do NOT use .withMetadata() - it preserves metadata!
    // Just re-encode to strip all EXIF/GPS/XMP
    const cleanBuffer = await sharp(originalPath)
      .jpeg({ quality: 85 })
      .toBuffer();
    
    console.log(`   ✓ Re-encoded image (${cleanBuffer.length} bytes)`);
    
    // Check cleaned metadata
    const cleanMetadata = await sharp(cleanBuffer).metadata();
    console.log('\n3. Verifying cleaned image...');
    console.log(`   - Has EXIF: ${cleanMetadata.exif ? 'YES (FAIL!)' : 'NO (OK)'}`);
    console.log(`   - Has XMP: ${cleanMetadata.xmp ? 'YES (FAIL!)' : 'NO (OK)'}`);
    console.log(`   - Has ICC: ${cleanMetadata.icc ? 'YES (OK - color profile retained)' : 'NO (OK)'}`);
    
    const success = !cleanMetadata.exif && !cleanMetadata.xmp;
    
    if (success) {
      console.log('\n✅ PASS: EXIF/GPS metadata successfully stripped!');
    } else {
      console.log('\n❌ FAIL: Metadata still present after stripping!');
    }
    
    return success;
  } catch (err) {
    console.error(`   ✗ Failed to strip metadata: ${err}`);
    return false;
  }
}

testExifStripping()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
