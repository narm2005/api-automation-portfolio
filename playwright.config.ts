import { defineConfig } from '@playwright/test';
import 'dotenv/config';

/**
 * API-only Playwright config: no browsers are launched.
 * Each protocol is its own project so CI can run / report them separately.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,          // public demo APIs can be flaky
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    extraHTTPHeaders: { Accept: 'application/json, text/xml' },
  },
  projects: [
    { name: 'graphql', testDir: './tests/graphql' },
    { name: 'soap', testDir: './tests/soap' },
    { name: 'contract', testDir: './tests/contract' },
  ],
});
