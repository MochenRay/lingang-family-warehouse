import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const frontendPort = Number(process.env.FRONTEND_PORT ?? '5173');
const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}/api`;
const playwrightDbPath = process.env.PLAYWRIGHT_DB_PATH
  ?? resolve('.runtime/lingang-playwright.db');
const pythonBin = process.env.PYTHON_BIN
  ?? (existsSync('backend/.venv/bin/python') ? 'backend/.venv/bin/python' : 'python3');

process.env.PLAYWRIGHT_DB_PATH = playwrightDbPath;

export default defineConfig({
  testDir: './tests/e2e',
  globalTeardown: './tests/e2e/global-teardown.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results/playwright',
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? undefined
    : [
        {
          command: './scripts/start-e2e-backend.sh',
          url: `${backendUrl}/health`,
          env: {
            ...process.env,
            BACKEND_PORT: String(backendPort),
            FRONTEND_PORT: String(frontendPort),
            PLAYWRIGHT_DB_PATH: playwrightDbPath,
            PYTHON_BIN: pythonBin,
          },
          reuseExistingServer: false,
          timeout: 120_000,
        },
        {
          command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
          url: frontendUrl,
          env: {
            ...process.env,
            VITE_API_URL: backendUrl,
            VITE_DATA_MODE: 'api',
          },
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ],
});
