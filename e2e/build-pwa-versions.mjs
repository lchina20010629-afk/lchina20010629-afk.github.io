#!/usr/bin/env node

/**
 * Build VERSION A and B for PWA upgrade testing
 * - Same date course with different content
 * - Different SW versions
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_PASSWORD = 'TestPWA123!';
const COURSE_DATE = '2024-06-01';

function encryptCourse(courseData, password, outputDir, date) {
  // Write course JSON to temp file
  const tempFile = join(outputDir, `temp-course-${date}.json`);
  writeFileSync(tempFile, JSON.stringify(courseData, null, 2));
  
  // Use production encrypt-entry.ts script
  try {
    execSync(
      `echo "${password}" | npx tsx scripts/encrypt-entry.ts --type course --date ${date} --input ${tempFile} --output ${outputDir} --stdin-password`,
      { stdio: 'inherit', cwd: process.cwd() }
    );
  } finally {
    // Clean up temp file
    try { rmSync(tempFile); } catch {}
  }
}

console.log('Building production dist...');
execSync('npm run build', { stdio: 'inherit' });

const testOutputDir = join(process.cwd(), 'test-output');
mkdirSync(testOutputDir, { recursive: true });

// VERSION A
console.log('\nBuilding VERSION A...');
const buildADir = join(testOutputDir, 'pwa-real-a');
rmSync(buildADir, { recursive: true, force: true });
cpSync('dist', buildADir, { recursive: true });

// Modify SW cache version to force update
const swAPath = join(buildADir, 'sw.js');
let swAContent = readFileSync(swAPath, 'utf-8');
swAContent = swAContent.replace(/const CACHE_VERSION = '[^']*';/, "const CACHE_VERSION = 'pwa-test-v1';");
writeFileSync(swAPath, swAContent);
console.log('  Modified sw.js: CACHE_VERSION = pwa-test-v1');

// Create course A
const courseAData = {
  title: `学习记录 ${COURSE_DATE}`,
  content: {
    courses: [{
      name: 'English',
      targetMinutes: 10,
      actualMinutes: 10,
      completed: true,
      materials: ['VERSION A Material'],
      exercises: ['VERSION A Exercise'],
      reflection: 'This is VERSION A content'
    }],
    totalMinutes: 10,
    notes: 'VERSION A Notes'
  }
};

mkdirSync(join(buildADir, 'data', 'encrypted'), { recursive: true });
const buildADataDir = join(buildADir, 'data');
encryptCourse(courseAData, TEST_PASSWORD, buildADataDir, COURSE_DATE);

// Manifest A (with required vault field)
const manifestA = {
  version: '1.0.0',
  vault: {
    version: '1.0.0',
    verifier: {
      salt: 'dGVzdFNhbHQ=',
      verifier: 'dGVzdFZlcmlmaWVy',
      iterations: 600000
    },
    createdAt: new Date().toISOString()
  },
  generatedAt: new Date().toISOString(),
  entries: [{
    id: `course-${COURSE_DATE}`,
    type: 'course',
    date: COURSE_DATE,
    title: `学习记录 ${COURSE_DATE}`,
    encryptedPath: `encrypted/course-${COURSE_DATE}.enc`
  }]
};
writeFileSync(join(buildADir, 'data', 'manifest.json'), JSON.stringify(manifestA, null, 2));

console.log('✓ VERSION A ready');

// VERSION B
console.log('\nBuilding VERSION B...');
const buildBDir = join(testOutputDir, 'pwa-real-b');
rmSync(buildBDir, { recursive: true, force: true });
cpSync(buildADir, buildBDir, { recursive: true });

// Modify SW cache version to force update (different from A!)
const swBPath = join(buildBDir, 'sw.js');
let swBContent = readFileSync(swBPath, 'utf-8');
swBContent = swBContent.replace(/const CACHE_VERSION = '[^']*';/, "const CACHE_VERSION = 'pwa-test-v2';");
writeFileSync(swBPath, swBContent);
console.log('  Modified sw.js: CACHE_VERSION = pwa-test-v2');

// Create DIFFERENT course B (same date!)
const courseBData = {
  title: `学习记录 ${COURSE_DATE}`,
  content: {
    courses: [{
      name: 'English',
      targetMinutes: 10,
      actualMinutes: 10,
      completed: true,
      materials: ['VERSION B Material - UPDATED'],
      exercises: ['VERSION B Exercise - UPDATED'],
      reflection: 'This is VERSION B content - UPDATED'
    }],
    totalMinutes: 10,
    notes: 'VERSION B Notes - UPDATED'
  }
};

const buildBDataDir = join(buildBDir, 'data');
encryptCourse(courseBData, TEST_PASSWORD, buildBDataDir, COURSE_DATE);

// Manifest B (with required vault field, updated version)
const manifestB = {
  version: '1.0.0',  // Keep same version for compatibility
  vault: {
    version: '1.0.0',
    verifier: {
      salt: 'dGVzdFNhbHQ=',
      verifier: 'dGVzdFZlcmlmaWVy',
      iterations: 600000
    },
    createdAt: new Date().toISOString()
  },
  generatedAt: new Date(Date.now() + 1000).toISOString(),
  entries: [{
    id: `course-${COURSE_DATE}`,
    type: 'course',
    date: COURSE_DATE,
    title: `学习记录 ${COURSE_DATE}`,
    encryptedPath: `encrypted/course-${COURSE_DATE}.enc`
  }]
};
writeFileSync(join(buildBDir, 'data', 'manifest.json'), JSON.stringify(manifestB, null, 2));

console.log('✓ VERSION B ready with DIFFERENT content for SAME date');
console.log('\n=== Builds complete ===');
console.log(`A: ${buildADir}`);
console.log(`B: ${buildBDir}`);
