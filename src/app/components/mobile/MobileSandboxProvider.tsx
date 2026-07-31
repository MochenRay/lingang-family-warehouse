import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  activateMobileSandboxModeSession,
  createMobileSandboxModeSession,
  type MobileSandboxModeSession,
} from '../../services/mobileSandbox/mode';
import { resetMobileSession } from '../../services/mobileSandbox/store';
import type { MobileSandboxMode } from '../../services/mobileSandbox/types';

interface MobileSandboxContextValue {
  mode: MobileSandboxMode;
  reason?: string;
  canMutate: boolean;
  canUseLegacyApiMutation: boolean;
  reset(): void;
}

const MobileSandboxContext = createContext<MobileSandboxContextValue | undefined>(undefined);

export function MobileSandboxProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<MobileSandboxModeSession | null>(null);
  if (!sessionRef.current) {
    sessionRef.current = createMobileSandboxModeSession();
  }
  const [state, setState] = useState<{ mode: MobileSandboxMode; reason?: string }>({ mode: 'checking' });

  useEffect(() => {
    const session = sessionRef.current!;
    const deactivate = activateMobileSandboxModeSession(session);
    let cancelled = false;
    void session.resolve().then((result) => {
      if (!cancelled) {
        setState(result);
      }
    });
    return () => {
      cancelled = true;
      deactivate();
    };
  }, []);

  return (
    <MobileSandboxContext.Provider
      value={{
        ...state,
        canMutate: state.mode === 'api' || state.mode === 'session',
        canUseLegacyApiMutation: state.mode === 'api',
        reset: resetMobileSession,
      }}
    >
      {children}
    </MobileSandboxContext.Provider>
  );
}

export function useMobileSandbox(): MobileSandboxContextValue {
  const value = useContext(MobileSandboxContext);
  if (!value) {
    throw new Error('useMobileSandbox must be used inside MobileSandboxProvider');
  }
  return value;
}
