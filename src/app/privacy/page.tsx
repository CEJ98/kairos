import { AppShell } from '@/components/layout/app-shell';

export default function PrivacyPage() {
  return (
    <AppShell variant="landing" showAuthControls>
      <section className="mx-auto max-w-3xl py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Política de Privacidad</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Recogemos datos mínimos para operar el servicio. No almacenamos PII en
          analítica; usamos hash de IP con sal. Errores se registran en Sentry con
          redacción agresiva.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-neutral-700">
          <li>No compartimos información con terceros fuera de proveedores críticos.</li>
          <li>Puedes solicitar eliminación de tu cuenta y datos asociados.</li>
          <li>Cookies opcionales para preferencias; desactivadas si no aceptas.</li>
          <li>Analítica sin cookies cuando es posible (Umami), o PostHog limitada.</li>
        </ul>
      </section>
    </AppShell>
  );
}