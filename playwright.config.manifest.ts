import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for manifest E2E tests
 * Tests CLI-generated manifest loading in production build
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/manifest.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  
  use: {
    baseURL: 'http://localhost:8174',
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
    command: 'node serve-dist.cjs',
    port: 8174,
    timeout: 10000,
    reuseExistingServer: false,
    env: {
      PORT: '8174',
    },
  },
});
