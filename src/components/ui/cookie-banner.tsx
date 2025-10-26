"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ENABLE = (process.env.NEXT_PUBLIC_ENABLE_COOKIE_BANNER ?? process.env.ENABLE_COOKIE_BANNER) === 'true';
const KEY = 'kairos_cookie_consent_v1';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ENABLE) return;
    const accepted = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    setShow(!accepted);
  }, []);

  if (!ENABLE || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl rounded-t-2xl border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-neutral-700">
          Usamos cookies mínimas para preferencias. Consulta{' '}
          <Link href="/privacy" className="underline">Privacidad</Link> y{' '}
          <Link href="/terms" className="underline">Términos</Link>.
        </p>
        <button
          className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          onClick={() => {
            window.localStorage.setItem(KEY, 'accepted');
            setShow(false);
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}