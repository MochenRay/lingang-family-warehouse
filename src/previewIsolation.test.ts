import { describe, expect, it } from 'vitest';

import playwrightConfig from '../playwright.config';

describe('Playwright database isolation', () => {
  it('never reuses an unknown local backend or frontend server', () => {
    const servers = Array.isArray(playwrightConfig.webServer)
      ? playwrightConfig.webServer
      : [playwrightConfig.webServer];

    expect(servers).toHaveLength(2);
    expect(servers.every((server) => server?.reuseExistingServer === false)).toBe(true);
  });
});
