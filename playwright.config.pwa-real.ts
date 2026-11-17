import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'pwa-real-upgrade.spec.ts',
  timeout: 120000, // 2 minutes per test
  fullyParallel: false, // Run sequentially due to shared server
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker for server control
  reporter: 'list',
  
  use: {
    baseURL: 'http://localhost:5555',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },
  
  webServer: undefined, // We manage our own switchable server
});
