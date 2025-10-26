"use client";

import { useEffect, useState } from 'react';

type ToastMessage = { id: number; title: string; description?: string };

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { title: string; description?: string };
      const id = Date.now();
      setMessages((prev) => [...prev, { id, ...detail }]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 2500);
    };
    window.addEventListener('kairos:toast', handler as unknown as (ev: Event) => void);
    return () => window.removeEventListener('kairos:toast', handler as unknown as (ev: Event) => void);
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
      {messages.map((m) => (
        <div key={m.id} className="rounded-2xl bg-foreground px-4 py-3 text-background shadow-soft">
          <p className="text-sm font-semibold">{m.title}</p>
          {m.description ? (
            <p className="text-xs text-background/80">{m.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function toast(detail: { title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent('kairos:toast', { detail }));
}