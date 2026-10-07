'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Currency, SystemInfo } from '@gbt/shared';
import { api } from './api';

/* ---------------------------------- types --------------------------------- */

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  isGuest: boolean;
  plan: string;
  currency: Currency;
}
export type Usage = Record<string, { used: number; limit: number }>;
type System = SystemInfo & { features?: { assistant: boolean; domainFirst: boolean; googleLogin: boolean } };

interface AppState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  me: Me | null;
  usage: Usage | null;
  refreshMe: () => Promise<void>;
  system: System | null;
  toast: (msg: string, kind?: 'info' | 'error') => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export function Providers({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('INR');
  const [me, setMe] = useState<Me | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [system, setSystem] = useState<System | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; kind: 'info' | 'error' }>>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gbt:currency');
      if (saved === 'USD' || saved === 'INR') setCurrencyState(saved);
      else if (!Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Asia/Kolkata') && !navigator.language.endsWith('IN')) {
        // India-first default; visitors clearly outside India start in USD.
        if (/^America\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone)) setCurrencyState('USD');
      }
    } catch {
      /* storage blocked — keep INR */
    }
    api<System>('/api/system').then(setSystem).catch(() => undefined);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api<{ user: Me | null; usage?: Usage }>('/api/auth/me');
      setMe(r.user);
      setUsage(r.usage ?? null);
      if (r.user?.currency && !localStorage.getItem('gbt:currency')) setCurrencyState(r.user.currency);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const setCurrency = useCallback(
    (c: Currency) => {
      setCurrencyState(c);
      try {
        localStorage.setItem('gbt:currency', c);
      } catch {
        /* ignore */
      }
      if (me) api('/api/me', { method: 'PATCH', body: { currency: c } }).catch(() => undefined);
    },
    [me],
  );

  const toast = useCallback((msg: string, kind: 'info' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ currency, setCurrency, me, usage, refreshMe, system, toast }), [currency, setCurrency, me, usage, refreshMe, system, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
            {t.kind === 'info' && (
              <svg width="14" height="14" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M32 2 Q36 28 62 32 Q36 36 32 62 Q28 36 2 32 Q28 28 32 2Z" fill="#19C3B4" />
              </svg>
            )}
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
