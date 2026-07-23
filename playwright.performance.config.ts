import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const frontendPort = Number(process.env.PERF_FRONTEND_PORT ?? '15343');
const backendPort = Number(process.env.PERF_BACKEND_PORT ?? '18070');
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}/api`;
const playwrightDbPath = process.env.PERF_DB_PATH ?? resolve('.runtime/lingang-performance.db');
const pythonBin = process.env.PYTHON_BIN
  ?? (existsSync('backend/.venv/bin/python') ? 'backend/.venv/bin/python' : 'python3');

export default defineConfig({
  testDir: './tests/performance',
  testMatch: 'route-performance.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 1_200_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-performance' }]] : 'list',
  outputDir: 'test-results/playwright-performance',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: frontendUrl,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
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
      command: `npm run preview -- --host 127.0.0.1 --port ${frontendPort}`,
      url: frontendUrl,
      env: process.env,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
