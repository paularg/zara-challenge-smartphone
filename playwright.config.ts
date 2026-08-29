import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-393',
      use: { browserName: 'chromium', viewport: { width: 393, height: 852 } },
    },
    {
      name: 'tablet-834',
      use: { browserName: 'chromium', viewport: { width: 834, height: 1194 } },
    },
    {
      name: 'intermediate-768',
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'intermediate-1280',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop-1920',
      use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'chrome-mobile-393',
      grep: /@critical/,
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: 'edge-mobile-393',
      grep: /@critical/,
      use: {
        browserName: 'chromium',
        channel: 'msedge',
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: 'firefox-mobile-393',
      grep: /@critical/,
      use: { browserName: 'firefox', viewport: { width: 393, height: 852 } },
    },
    {
      name: 'mobile-safari-iphone-15',
      grep: /@critical/,
      use: { ...devices['iPhone 15'] },
    },
  ],
  webServer: {
    command: 'API_KEY=e2e-key pnpm dev --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
