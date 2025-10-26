'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
        <h1 className="font-display text-2xl font-bold text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {error?.message || 'No pudimos cargar esta vista. Vuelve a intentarlo.'}
        </p>
        <button
          className="mt-4 w-full rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
          onClick={() => reset()}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}