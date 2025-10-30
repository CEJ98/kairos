'use client';
import { clientLogger } from "@/lib/logging/client";

import { useEffect } from 'react';

const SW_PATH = '/service-worker.js';

export function PwaProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // En desarrollo, NO registramos el SW y además limpiamos cualquier registro previo
    if (process.env.NODE_ENV !== 'production') {
      // Desregistrar SWs previos y limpiar caches usadas por la app
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => keys.forEach((key) => {
            if (key.startsWith('kairos-')) {
              caches.delete(key).catch(() => {});
            }
          }))
          .catch(() => {});
      }
      return;
    }

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
        clientLogger.error('Error registrando service worker', error);
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
