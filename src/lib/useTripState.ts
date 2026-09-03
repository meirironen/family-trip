import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyState, normalize, type TripState } from './state.ts';

const API = '/api/state';
const LOCAL_KEY = 'family-trip:state';
const POLL_MS = 8000;

export type SyncStatus = 'loading' | 'synced' | 'saving' | 'local' | 'error';

/** What the server stores and returns. */
interface TripDoc {
  rev: number;
  data: unknown;
}

export interface TripStore {
  state: TripState | null;
  status: SyncStatus;
  /** Apply a transition; it is saved for everyone. */
  update: (fn: (prev: TripState) => TripState) => void;
  /** False when there's no backend and we're on localStorage only. */
  shared: boolean;
}

/**
 * Shared itinerary state.
 *
 * Talks to /api/state (Upstash-backed). If that endpoint isn't configured the
 * hook falls back to this browser's localStorage, so the app still works.
 *
 * Concurrency: every save carries the revision it was based on. The server
 * rejects a stale save with 409 and returns the current document, which we
 * adopt — so a later writer can't silently drop an earlier one.
 */
export function useTripState(): TripStore {
  const [state, setState] = useState<TripState | null>(null);
  const [status, setStatus] = useState<SyncStatus>('loading');

  const rev = useRef(-1); // -1 = no server, local only
  const pending = useRef(false);
  const saving = useRef(false);
  const latest = useRef<TripState | null>(null);

  latest.current = state;

  // ---- initial load ----
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(API, { cache: 'no-store' });
        if (!res.ok) throw new Error(`api ${res.status}`);
        const doc = (await res.json()) as TripDoc;
        if (cancelled) return;

        rev.current = Number(doc.rev) || 0;
        const hasData = doc.data && Object.keys(doc.data as object).length > 0;
        setState(normalize(hasData ? doc.data : emptyState()));
        setStatus('synced');
      } catch {
        if (cancelled) return;
        rev.current = -1;
        setState(normalize(readLocal() ?? emptyState()));
        setStatus('local');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- save ----
  const flush = useCallback(async (): Promise<void> => {
    if (saving.current || !pending.current || rev.current < 0 || !latest.current) return;

    saving.current = true;
    pending.current = false;
    setStatus('saving');

    try {
      const res = await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rev: rev.current, data: latest.current }),
      });
      const body = (await res.json()) as TripDoc;

      if (res.status === 409) {
        // someone else saved first — take their version
        rev.current = body.rev;
        setState(normalize(body.data));
        setStatus('synced');
      } else if (res.ok) {
        rev.current = body.rev;
        setStatus('synced');
      } else {
        throw new Error(`api ${res.status}`);
      }
    } catch {
      pending.current = true;
      setStatus('error');
    } finally {
      saving.current = false;
      if (pending.current) void flush();
    }
  }, []);

  /**
   * The next state is computed outside setState, so saving never runs twice
   * under StrictMode's double-invoked updaters.
   */
  const update = useCallback<TripStore['update']>(
    (fn) => {
      const prev = latest.current;
      if (!prev) return;

      const next = fn(prev);
      if (next === prev) return;

      latest.current = next;
      setState(next);
      writeLocal(next);

      if (rev.current >= 0) {
        pending.current = true;
        queueMicrotask(() => void flush());
      }
    },
    [flush]
  );

  // ---- poll for other people's changes ----
  useEffect(() => {
    if (status === 'loading' || rev.current < 0) return undefined;

    const timer = window.setInterval(() => {
      if (pending.current || saving.current || document.hidden) return;

      void (async () => {
        try {
          const res = await fetch(API, { cache: 'no-store' });
          if (!res.ok) return;
          const doc = (await res.json()) as TripDoc;
          if (doc.rev !== rev.current && !pending.current && !saving.current) {
            rev.current = doc.rev;
            setState(normalize(doc.data));
          }
        } catch {
          /* offline: keep showing what we have */
        }
      })();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [status]);

  return { state, status, update, shared: rev.current >= 0 };
}

function readLocal(): unknown {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeLocal(value: TripState): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
  } catch {
    /* private mode / quota: not fatal */
  }
}
