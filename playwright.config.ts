import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Browser tests run against the built site (dist/), so `npm run build` comes
 * first; `npm run verify` does both. They exist because some faults only show
 * in a real browser: content left hidden by an animation, a menu that cannot
 * be reached from the keyboard, lettering that Safari spaces differently.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node tests/serve.mjs ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
