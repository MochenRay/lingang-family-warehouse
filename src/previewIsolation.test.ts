import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import playwrightConfig, {
  resolvePlaywrightAppMode,
  resolvePlaywrightRuntime,
} from '../playwright.config';

const projectRoot = resolve(import.meta.dirname, '..');

describe('Playwright database isolation', () => {
  it('never reuses an unknown local backend or frontend server', () => {
    const servers = Array.isArray(playwrightConfig.webServer)
      ? playwrightConfig.webServer
      : [playwrightConfig.webServer];

    expect(servers).toHaveLength(2);
    expect(servers.every((server) => server?.reuseExistingServer === false)).toBe(true);
  });

  it('keeps enabled mode as the default and excludes public specs', () => {
    const enabled = resolvePlaywrightRuntime(resolvePlaywrightAppMode(undefined), {});

    expect(enabled).toMatchObject({
      appMode: 'enabled',
      frontendPort: 5173,
      backendPort: 8000,
      demoWriteMode: 'enabled',
      outputDir: 'test-results/playwright',
      reportDir: 'playwright-report',
      testMatch: undefined,
      testIgnore: '**/*.public.spec.ts',
    });
    expect(enabled.playwrightDbPath).toBe(resolve('.runtime/lingang-playwright.db'));
  });

  it('isolates public mode and only selects public specs', () => {
    const publicRuntime = resolvePlaywrightRuntime('public', {});

    expect(publicRuntime).toMatchObject({
      appMode: 'public',
      frontendPort: 15174,
      backendPort: 18001,
      demoWriteMode: 'readonly',
      outputDir: 'test-results/playwright-public',
      reportDir: 'playwright-report-public',
      testMatch: '**/*.public.spec.ts',
      testIgnore: undefined,
    });
    expect(publicRuntime.playwrightDbPath).toBe(
      resolve('.runtime/lingang-playwright-public.db'),
    );
  });

  it('fails fast for an unsupported application mode', () => {
    expect(() => resolvePlaywrightAppMode('token')).toThrow(
      'PLAYWRIGHT_APP_MODE must be "enabled" or "public"',
    );
    expect(() => resolvePlaywrightAppMode('')).toThrow(
      'PLAYWRIGHT_APP_MODE must be "enabled" or "public"',
    );
  });

  it('wires the public command and CI artifacts without adding another job', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };
    const workflow = readFileSync(
      resolve(projectRoot, '.github/workflows/ci.yml'),
      'utf8',
    );

    expect(packageJson.scripts['test:e2e:public']).toBe(
      'PLAYWRIGHT_APP_MODE=public playwright test',
    );
    expect(workflow).toContain('run: npm run test:e2e:public');
    expect(workflow).toContain('playwright-report-public/');
    expect(workflow).toContain('test-results/playwright-public/');
    const jobsSection = workflow.slice(workflow.indexOf('\njobs:\n'));
    expect(jobsSection.match(/^  [a-z][a-z0-9_-]+:\s*$/gm)).toHaveLength(4);
  });

  it('lets the backend launcher inherit only enabled or readonly write modes', () => {
    const launcher = readFileSync(
      resolve(projectRoot, 'scripts/start-e2e-backend.sh'),
      'utf8',
    );

    expect(launcher).toContain('DEMO_WRITE_MODE="${DEMO_WRITE_MODE:-enabled}"');
    expect(launcher).toContain('enabled|readonly)');
    expect(launcher).not.toContain('export DEMO_WRITE_MODE="enabled"');
  });
});
