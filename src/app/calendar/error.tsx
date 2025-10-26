"use client";

import { AppShell } from '@/components/layout/app-shell';

export default function ErrorCalendar() {
  return (
    <AppShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground">Error cargando calendario</h2>
        <p className="text-sm text-neutral-600">Intenta recargar la página o vuelve más tarde.</p>
      </div>
    </AppShell>
  );
}