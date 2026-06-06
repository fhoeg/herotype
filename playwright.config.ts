import { defineConfig, devices } from '@playwright/test'

/**
 * Validation harness for HEROTYPE (spec: "Validation pass — demo-ready baseline").
 * Runs against the PRODUCTION bundle (vite build + preview) so V7 reflects the
 * real deployed artifact, not the dev server.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: './tests/.output',
  use: {
    baseURL: 'http://localhost:4173',
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // build fresh, then serve the static bundle on the baseURL port
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
