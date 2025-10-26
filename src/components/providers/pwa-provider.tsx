'use client';

import { useEffect } from 'react';

const SW_PATH = '/service-worker.js';

export function PwaProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (process.env.NODE_ENV !== 'production' && !isLocalhost) return;

    let refreshing = false;
    let controllerListener: (() => void) | null = null;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const handleWaiting = (waiting: ServiceWorker | null) => {
      if (!waiting) return;
      waiting.postMessage('SKIP_WAITING');
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });

        if (registration.waiting) {
          handleWaiting(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          handleWaiting(registration.installing);
        });

        controllerListener = handleControllerChange;
        navigator.serviceWorker.addEventListener('controllerchange', controllerListener);
      } catch (error) {
        console.error('Error registrando service worker', error);
      }
    };

    void registerServiceWorker();

    return () => {
      if (controllerListener) {
        navigator.serviceWorker.removeEventListener('controllerchange', controllerListener);
      }
    };
  }, []);

  return null;
}
