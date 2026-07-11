import { afterEach, describe, expect, it, vi } from 'vitest';

import { taskRuleRepository } from './taskRuleRepository';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('taskRuleRepository', () => {
  it('updates the local rule set without contacting the API in explicit fallback mode', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('API must not be called in fallback mode');
    });
    vi.stubEnv('VITE_DATA_MODE', 'fallback');
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      location: { hostname: 'localhost' },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('CustomEvent', class {
      constructor(
        public type: string,
        public init?: CustomEventInit,
      ) {}
    });
    vi.stubGlobal('Event', class {
      constructor(public type: string) {}
    });

    const updated = await taskRuleRepository.updateRule('rule_visit_followup', { enabled: false });

    expect(updated.enabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await taskRuleRepository.getRules()).find((rule) => rule.id === updated.id)?.enabled).toBe(false);

    await taskRuleRepository.updateRule('rule_visit_followup', { enabled: true });
  });
});
