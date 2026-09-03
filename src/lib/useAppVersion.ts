import { useEffect, useState } from 'react';

export type WorkerState = 'unsupported' | 'none' | 'active' | 'update-ready';

export interface AppVersion {
  /** Build stamp baked in at compile time. */
  build: string;
  /** Whether a service worker is actually running this page. */
  worker: WorkerState;
  /** Reloads onto the waiting build. Only meaningful when 'update-ready'. */
  applyUpdate: () => void;
}

/**
 * What's running right now — the build stamp plus the service worker's state.
 *
 * With a service worker in play, "which version am I looking at" stops being
 * obvious: a phone can hold an old build indefinitely. This makes it visible
 * and gives a one-tap way out.
 */
export function useAppVersion(): AppVersion {
  const [worker, setWorker] = useState<WorkerState>('unsupported');

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    let cancelled = false;

    const read = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (cancelled) return;

      if (!registration) setWorker('none');
      else if (registration.waiting) setWorker('update-ready');
      else if (navigator.serviceWorker.controller) setWorker('active');
      else setWorker('none');
    };

    void read();

    // a new build finishing install while the app is open
    const onChange = () => void read();
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    const timer = window.setInterval(onChange, 30_000);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      window.clearInterval(timer);
    };
  }, []);

  const applyUpdate = () => {
    void (async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    })();
  };

  return { build: __APP_VERSION__, worker, applyUpdate };
}
