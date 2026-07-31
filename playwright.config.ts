import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

export type PlaywrightAppMode = 'enabled' | 'public';

export function resolvePlaywrightAppMode(
  value = process.env.PLAYWRIGHT_APP_MODE,
): PlaywrightAppMode {
  const appMode = value ?? 'enabled';
  if (appMode !== 'enabled' && appMode !== 'public') {
    throw new Error(
      `PLAYWRIGHT_APP_MODE must be "enabled" or "public"; received ${JSON.stringify(appMode)}`,
    );
  }
  return appMode;
}

export function resolvePlaywrightRuntime(
  appMode: PlaywrightAppMode,
  env: NodeJS.ProcessEnv = process.env,
) {
  const isPublic = appMode === 'public';
  return {
    appMode,
    frontendPort: Number(env.FRONTEND_PORT ?? (isPublic ? '15174' : '5173')),
    backendPort: Number(env.BACKEND_PORT ?? (isPublic ? '18001' : '8000')),
    playwrightDbPath: env.PLAYWRIGHT_DB_PATH
      ?? resolve(isPublic
        ? '.runtime/lingang-playwright-public.db'
        : '.runtime/lingang-playwright.db'),
    demoWriteMode: isPublic ? 'readonly' : 'enabled',
    outputDir: isPublic
      ? 'test-results/playwright-public'
      : 'test-results/playwright',
    reportDir: isPublic ? 'playwright-report-public' : 'playwright-report',
    testMatch: isPublic ? '**/*.public.spec.ts' : undefined,
    testIgnore: isPublic ? undefined : '**/*.public.spec.ts',
  } as const;
}

const appMode = resolvePlaywrightAppMode();
const runtime = resolvePlaywrightRuntime(appMode);
const frontendPort = runtime.frontendPort;
const backendPort = runtime.backendPort;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}/api`;
const playwrightDbPath = runtime.playwrightDbPath;
const pythonBin = process.env.PYTHON_BIN
  ?? (existsSync('backend/.venv/bin/python') ? 'backend/.venv/bin/python' : 'python3');

process.env.PLAYWRIGHT_DB_PATH = playwrightDbPath;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: runtime.testMatch,
  testIgnore: runtime.testIgnore,
  globalTeardown: './tests/e2e/global-teardown.ts',
  // golden diff 基线 PNG 入仓路径（P5-T2）：canonical 环境为 GitHub Actions ubuntu-latest + chromium
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: runtime.reportDir }]]
    : 'list',
  outputDir: runtime.outputDir,
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
            DEMO_WRITE_MODE: runtime.demoWriteMode,
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
