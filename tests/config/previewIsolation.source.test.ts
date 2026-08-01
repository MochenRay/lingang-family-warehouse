import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');

describe('source-only Playwright infrastructure', () => {
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
