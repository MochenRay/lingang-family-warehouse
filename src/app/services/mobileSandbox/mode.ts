import { getApiBaseUrl } from '../api';
import type { MobileSandboxModeResult } from './types';

const HEALTH_TIMEOUT_MS = 5_000;

interface HealthPayload {
  demo_write_mode?: unknown;
}

export interface MobileSandboxModeSession {
  resolve(): Promise<MobileSandboxModeResult>;
}

function healthUrl(): string {
  return `${getApiBaseUrl().replace(/\/$/, '')}/health`;
}

export async function fetchMobileSandboxMode(): Promise<MobileSandboxModeResult> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(healthUrl(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-store',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { mode: 'blocked', reason: `health-${response.status}` };
    }
    const payload = await response.json() as HealthPayload;
    if (payload.demo_write_mode === 'enabled') {
      return { mode: 'api' };
    }
    if (payload.demo_write_mode === 'readonly') {
      return { mode: 'session' };
    }
    return { mode: 'blocked', reason: payload.demo_write_mode === 'token' ? 'token-mode' : 'invalid-mode' };
  } catch (error) {
    return {
      mode: 'blocked',
      reason: error instanceof DOMException && error.name === 'AbortError' ? 'health-timeout' : 'health-unavailable',
    };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function createMobileSandboxModeSession(): MobileSandboxModeSession {
  let resolution: Promise<MobileSandboxModeResult> | undefined;
  return {
    resolve() {
      resolution ??= fetchMobileSandboxMode();
      return resolution;
    },
  };
}

let activeSession: MobileSandboxModeSession | undefined;

export function activateMobileSandboxModeSession(session: MobileSandboxModeSession): () => void {
  activeSession = session;
  return () => {
    if (activeSession === session) {
      activeSession = undefined;
    }
  };
}

export async function getActiveMobileSandboxMode(): Promise<MobileSandboxModeResult> {
  if (!activeSession) {
    return { mode: 'blocked', reason: 'mode-not-initialized' };
  }
  return activeSession.resolve();
}
