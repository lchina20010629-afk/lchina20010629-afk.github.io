import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['courses.spec.ts', 'reviews.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  globalSetup: './e2e/global-setup-courses.ts',
  
  use: {
    baseURL: 'http://localhost:8175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'PORT=8175 node serve-dist.cjs',
    url: 'http://localhost:8175',
    reuseExistingServer: false,
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
