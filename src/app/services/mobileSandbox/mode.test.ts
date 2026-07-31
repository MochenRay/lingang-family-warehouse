import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activateMobileSandboxModeSession,
  createMobileSandboxModeSession,
  fetchMobileSandboxMode,
  getActiveMobileSandboxMode,
} from './mode';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mobile sandbox mode', () => {
  it.each([
    ['enabled', 'api'],
    ['readonly', 'session'],
    ['token', 'blocked'],
    ['unexpected', 'blocked'],
  ] as const)('maps %s health mode to %s', async (demoWriteMode, expectedMode) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      demo_write_mode: demoWriteMode,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(fetchMobileSandboxMode()).resolves.toMatchObject({ mode: expectedMode });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/health$/), expect.objectContaining({
      cache: 'no-store',
      headers: expect.objectContaining({ 'Cache-Control': 'no-store' }),
    }));
  });

  it('blocks non-success health responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('unavailable', { status: 503 }));
    await expect(fetchMobileSandboxMode()).resolves.toEqual({ mode: 'blocked', reason: 'health-503' });
  });

  it('blocks network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));
    await expect(fetchMobileSandboxMode()).resolves.toEqual({ mode: 'blocked', reason: 'health-unavailable' });
  });

  it('blocks after the fixed five-second timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));

    const result = fetchMobileSandboxMode();
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(result).resolves.toEqual({ mode: 'blocked', reason: 'health-timeout' });
    vi.useRealTimers();
  });

  it('resolves once per mounted session and blocks without an active session', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      demo_write_mode: 'readonly',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const session = createMobileSandboxModeSession();
    const deactivate = activateMobileSandboxModeSession(session);

    await expect(Promise.all([getActiveMobileSandboxMode(), getActiveMobileSandboxMode()])).resolves.toEqual([
      { mode: 'session' },
      { mode: 'session' },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();

    deactivate();
    await expect(getActiveMobileSandboxMode()).resolves.toEqual({ mode: 'blocked', reason: 'mode-not-initialized' });
  });
});
