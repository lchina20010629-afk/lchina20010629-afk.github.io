import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = '/tmp/test-course-fixtures';

async function globalSetup(config: FullConfig) {
  const distData = join(process.cwd(), 'dist/data');
  
  // Ensure dist/data exists
  await fs.mkdir(distData, { recursive: true });
  
  // Copy fixtures once for all tests
  console.log('Copying test fixtures to dist/data...');
  await fs.cp(join(FIXTURES_DIR, 'manifest.json'), join(distData, 'manifest.json'));
  await fs.cp(join(FIXTURES_DIR, 'encrypted'), join(distData, 'encrypted'), { recursive: true });
  console.log('Fixtures copied successfully');
}

export default globalSetup;
