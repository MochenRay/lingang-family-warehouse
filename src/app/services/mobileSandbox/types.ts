export const MOBILE_SANDBOX_STORAGE_KEY = 'lingang:mobile-sandbox:v1';
export const MOBILE_SANDBOX_CHANGE_EVENT = 'mobile-session-change';
export const MOBILE_SANDBOX_VERSION = 1 as const;

export type MobileSandboxEntity =
  | 'person'
  | 'house'
  | 'visit'
  | 'conflict'
  | 'patrolReport'
  | 'quickNote';

export type MobileSandboxAction = 'create' | 'update' | 'status' | 'tombstone';

export type MobileSessionObjectPayloadV1 = Record<string, unknown>;

export interface MobileSessionStatusPayloadV1 extends MobileSessionObjectPayloadV1 {
  status: string;
}

export interface MobileSessionEventV1 {
  id: string;
  entity: MobileSandboxEntity;
  action: MobileSandboxAction;
  targetId: string;
  tempId?: string;
  payload: unknown;
  createdAt: string;
}

export interface MobileSessionEnvelopeV1 {
  version: typeof MOBILE_SANDBOX_VERSION;
  events: MobileSessionEventV1[];
}

export type MobileSandboxMode = 'checking' | 'api' | 'session' | 'blocked';

export interface MobileSandboxModeResult {
  mode: Exclude<MobileSandboxMode, 'checking'>;
  reason?: string;
}
