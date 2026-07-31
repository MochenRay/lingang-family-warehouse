import { getActiveMobileSandboxMode } from './mode';

export class MobileMutationBlockedError extends Error {
  constructor(public readonly reason: string) {
    super('Mobile mutation is blocked until a safe data mode is confirmed');
    this.name = 'MobileMutationBlockedError';
  }
}
export interface MobileMutationHandlers<T> {
  api(): Promise<T>;
  session(): Promise<T> | T;
}

export async function executeMobileMutation<T>(handlers: MobileMutationHandlers<T>): Promise<T> {
  const result = await getActiveMobileSandboxMode();
  if (result.mode === 'api') {
    return handlers.api();
  }
  if (result.mode === 'session') {
    return handlers.session();
  }
  throw new MobileMutationBlockedError(result.reason ?? 'mode-blocked');
}
