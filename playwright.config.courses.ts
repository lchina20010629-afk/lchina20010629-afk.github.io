import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['courses.spec.ts', 'reviews.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  
  use: {
    baseURL: 'http://localhost:8174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'node serve-dist.cjs',
    url: 'http://localhost:8174',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
