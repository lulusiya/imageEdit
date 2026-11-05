'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { ApiError, createDemoSession, errorMessage, getSession } from './api';
import type { DemoIdentity, DemoUser } from './types';

type IdentityStatus = 'loading' | 'ready' | 'error';

interface IdentityContextValue {
  user: DemoUser | null;
  status: IdentityStatus;
  error: string | null;
  switching: boolean;
  switchIdentity: (identity: DemoIdentity) => Promise<void>;
  retry: () => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [status, setStatus] = useState<IdentityStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const epochRef = useRef(0);

  const bootstrap = useCallback(async () => {
    const epoch = ++epochRef.current;
    setStatus('loading');
    setError(null);
    try {
      let nextUser: DemoUser;
      try {
        const session = await getSession();
        nextUser = session.user;
      } catch (sessionError) {
        if (sessionError instanceof ApiError && sessionError.status === 401) {
          const session = await createDemoSession('A');
          nextUser = session.user;
        } else {
          throw sessionError;
        }
      }
      if (epoch !== epochRef.current) {
        return;
      }
      setUser(nextUser);
      setStatus('ready');
      setError(null);
    } catch (bootstrapError) {
      if (epoch !== epochRef.current) {
        return;
      }
      setUser(null);
      setStatus('error');
      setError(errorMessage(bootstrapError, '无法建立演示身份，请稍后重试'));
    }
  }, []);

  useEffect(() => {
    void bootstrap();
    return () => {
      epochRef.current += 1;
    };
  }, [bootstrap]);

  const switchIdentity = useCallback(async (identity: DemoIdentity) => {
    const epoch = ++epochRef.current;
    setSwitching(true);
    setError(null);
    try {
      const session = await createDemoSession(identity);
      if (epoch !== epochRef.current) {
        return;
      }
      setUser(session.user);
      setStatus('ready');
    } catch (switchError) {
      if (epoch === epochRef.current) {
        setError(errorMessage(switchError, '身份切换失败，请重试'));
      }
      throw switchError;
    } finally {
      if (epoch === epochRef.current) {
        setSwitching(false);
      }
    }
  }, []);

  const value = useMemo<IdentityContextValue>(
    () => ({
      user,
      status,
      error,
      switching,
      switchIdentity,
      retry: () => {
        void bootstrap();
      }
    }),
    [user, status, error, switching, switchIdentity, bootstrap]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used inside IdentityProvider');
  }
  return context;
}
