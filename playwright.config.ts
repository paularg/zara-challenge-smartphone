import { defineConfig } from '@playwright/test'

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
      use: { viewport: { width: 393, height: 852 } },
    },
    {
      name: 'tablet-834',
      use: { viewport: { width: 834, height: 1194 } },
    },
    {
      name: 'intermediate-768',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'intermediate-1280',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop-1920',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: 'API_KEY=e2e-key pnpm dev --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
