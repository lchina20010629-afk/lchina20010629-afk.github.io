#!/usr/bin/env node
/**
 * Generate test fixtures for E2E tests
 * Uses a synthetic test password to create encrypted course data
 */

import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_PASSWORD = 'TestPass123!';
const OUTPUT_DIR = 'test-output/data';
const FIXTURES_DIR = 'test-fixtures';

async function main() {
  console.log('🧪 Generating test fixtures...\n');
  
  // Clean and recreate output directory
  try {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
  } catch {}
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Encrypt diary entries
  const diaries = [
    { date: '2026-11-16', file: 'diary-fixture.json' },
  ];
  
  for (const { date, file } of diaries) {
    console.log(`📖 Encrypting diary ${date}...`);
    const inputPath = join(FIXTURES_DIR, file);
    
    try {
      execSync(
        `echo "${TEST_PASSWORD}" | npx tsx scripts/encrypt-entry.ts --type diary --date ${date} --input ${inputPath} --output ${OUTPUT_DIR} --stdin-password`,
        { stdio: 'inherit' }
      );
    } catch (err) {
      console.error(`Failed to encrypt ${file}`);
      throw err;
    }
  }
  
  // Encrypt course entries
  const courses = [
    { date: '2024-03-15', file: 'course-2024-03-15.json' },
    { date: '2024-03-16', file: 'course-2024-03-16.json' },
  ];
  
  for (const { date, file } of courses) {
    console.log(`📚 Encrypting course ${date}...`);
    const inputPath = join(FIXTURES_DIR, file);
    
    try {
      execSync(
        `echo "${TEST_PASSWORD}" | npx tsx scripts/encrypt-entry.ts --type course --date ${date} --input ${inputPath} --output ${OUTPUT_DIR} --stdin-password`,
        { stdio: 'inherit' }
      );
    } catch (err) {
      console.error(`Failed to encrypt ${file}`);
      throw err;
    }
  }
  
  console.log('\n✅ Test fixtures generated successfully!');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
