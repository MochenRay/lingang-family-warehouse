import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activateMobileSandboxModeSession,
  type MobileSandboxModeSession,
} from './mode';
import { MobileMutationBlockedError, executeMobileMutation } from './mutation';
import type { MobileSandboxModeResult } from './types';

let deactivate: (() => void) | undefined;

function activate(result: MobileSandboxModeResult) {
  const session: MobileSandboxModeSession = {
    resolve: vi.fn().mockResolvedValue(result),
  };
  deactivate = activateMobileSandboxModeSession(session);
}

afterEach(() => {
  deactivate?.();
  deactivate = undefined;
});

describe('executeMobileMutation', () => {
  it('uses only the API handler in enabled mode', async () => {
    activate({ mode: 'api' });
    const api = vi.fn().mockResolvedValue('api-result');
    const session = vi.fn().mockReturnValue('session-result');

    await expect(executeMobileMutation({ api, session })).resolves.toBe('api-result');
    expect(api).toHaveBeenCalledOnce();
    expect(session).not.toHaveBeenCalled();
  });

  it('uses only the session handler in readonly mode', async () => {
    activate({ mode: 'session' });
    const api = vi.fn().mockResolvedValue('api-result');
    const session = vi.fn().mockReturnValue('session-result');

    await expect(executeMobileMutation({ api, session })).resolves.toBe('session-result');
    expect(api).not.toHaveBeenCalled();
    expect(session).toHaveBeenCalledOnce();
  });

  it.each([401, 404, 409, 422, 429, 503])('never replays an API %i failure into session storage', async (status) => {
    activate({ mode: 'api' });
    const apiError = new Error(`API ${status}`);
    const api = vi.fn().mockRejectedValue(apiError);
    const session = vi.fn();

    await expect(executeMobileMutation({ api, session })).rejects.toBe(apiError);
    expect(session).not.toHaveBeenCalled();
  });

  it('never replays an API network failure into session storage', async () => {
    activate({ mode: 'api' });
    const apiError = new TypeError('network down');
    const session = vi.fn();

    await expect(executeMobileMutation({
      api: vi.fn().mockRejectedValue(apiError),
      session,
    })).rejects.toBe(apiError);
    expect(session).not.toHaveBeenCalled();
  });

  it('calls neither handler when mode is blocked or uninitialized', async () => {
    const api = vi.fn();
    const session = vi.fn();
    activate({ mode: 'blocked', reason: 'token-mode' });

    await expect(executeMobileMutation({ api, session })).rejects.toEqual(
      new MobileMutationBlockedError('token-mode'),
    );
    expect(api).not.toHaveBeenCalled();
    expect(session).not.toHaveBeenCalled();
  });

  it('expires a session lease when the mounted capability session is replaced', async () => {
    activate({ mode: 'session' });
    let release!: () => void;
    let markStarted!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { markStarted = resolve; });
    const sideEffect = vi.fn();

    const pending = executeMobileMutation({
      api: vi.fn(),
      session: async (lease) => {
        markStarted();
        await gate;
        lease.assertActive();
        sideEffect();
        return 'session-result';
      },
    });
    await started;

    deactivate?.();
    activate({ mode: 'api' });
    release();

    await expect(pending).rejects.toEqual(new MobileMutationBlockedError('mode-session-expired'));
    expect(sideEffect).not.toHaveBeenCalled();
  });
});
