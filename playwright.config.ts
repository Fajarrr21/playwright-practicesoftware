import { defineConfig, devices } from '@playwright/test';
import { API_URL, BASE_URL } from './tests/support/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Public shared demo server: keep parallelism polite.
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['blob'], ['github']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'api', testDir: './tests/api' },
    { name: 'chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testDir: './tests/ui', use: { ...devices['Desktop Safari'] } },
    { name: 'a11y', testDir: './tests/a11y', use: { ...devices['Desktop Chrome'] } },
  ],
});
