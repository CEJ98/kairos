import { AppShell } from '@/components/layout/app-shell';

export default function ErrorsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-12">
        <h1 className="font-display text-2xl font-bold text-foreground">Registro de errores</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Esta es una página mínima para diagnosticar errores. Revisa Sentry para detalles.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
          No se listan errores aquí por privacidad; sólo un marcador de ruta.
        </div>
      </div>
    </AppShell>
  );
}