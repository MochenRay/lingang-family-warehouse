import { acquireMobileSandboxModeLease } from './mode';

export class MobileMutationBlockedError extends Error {
  constructor(public readonly reason: string) {
    super('Mobile mutation is blocked until a safe data mode is confirmed');
    this.name = 'MobileMutationBlockedError';
  }
}
export interface MobileMutationHandlers<T> {
  api(): Promise<T>;
  session(lease: MobileMutationLease): Promise<T> | T;
}

export interface MobileMutationLease {
  assertActive(): void;
}

export async function executeMobileMutation<T>(handlers: MobileMutationHandlers<T>): Promise<T> {
  const lease = await acquireMobileSandboxModeLease();
  const { result } = lease;
  if (result.mode === 'api') {
    return handlers.api();
  }
  if (result.mode === 'session') {
    if (!lease.isActive()) {
      throw new MobileMutationBlockedError('mode-session-expired');
    }
    return handlers.session({
      assertActive() {
        if (!lease.isActive()) {
          throw new MobileMutationBlockedError('mode-session-expired');
        }
      },
    });
  }
  throw new MobileMutationBlockedError(result.reason ?? 'mode-blocked');
}
