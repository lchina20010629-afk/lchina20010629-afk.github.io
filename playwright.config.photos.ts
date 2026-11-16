import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for photo publication E2E tests
 * Tests CLI photo stripping + encryption + browser loading
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/photos.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  
  use: {
    baseURL: 'http://localhost:8176',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'PORT=8176 node serve-dist.cjs',
    port: 8176,
    timeout: 10000,
    reuseExistingServer: false,
    env: {
      PORT: '8176',
    },
  },
});
