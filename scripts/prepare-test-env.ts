#!/usr/bin/env node
/**
 * Prepare test environment by copying fixtures to dist/data
 */

import { cpSync, existsSync, mkdirSync } from 'fs';

const SOURCE_DIR = 'test-output/data';
const DEST_DIR = 'dist/data';

function main() {
  console.log('📦 Preparing test environment...');
  
  // Check if source exists
  if (!existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.error('   Run: npx tsx scripts/generate-test-fixtures.ts first');
    process.exit(1);
  }
  
  // Check if dist exists
  if (!existsSync('dist')) {
    console.error('❌ dist directory not found. Run: npm run build first');
    process.exit(1);
  }
  
  // Remove old test data if exists
  if (existsSync(DEST_DIR)) {
    console.log(`🗑️  Removing old test data from ${DEST_DIR}`);
    cpSync(DEST_DIR, DEST_DIR + '.backup', { recursive: true });
  }
  
  // Create dest directory
  mkdirSync(DEST_DIR, { recursive: true });
  
  // Copy test fixtures
  console.log(`📋 Copying ${SOURCE_DIR} → ${DEST_DIR}`);
  cpSync(SOURCE_DIR, DEST_DIR, { recursive: true });
  
  console.log('✅ Test environment ready!');
}

main();
