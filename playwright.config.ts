import { defineConfig, devices } from '@playwright/test'

// Local: needs the Firebase emulators (`npm run emulators`); this config starts `npm run dev` itself
//        and seeds the emulators if they are empty.
// Live:  BASE_URL=https://faridbettioui.art npm test   (admin tests are skipped)
const baseURL = process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: process.env.BASE_URL ? undefined : './tests/global-setup.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: 'list',
  timeout: 60_000,
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run dev', reuseExistingServer: true, url: baseURL, timeout: 120_000 },
})
