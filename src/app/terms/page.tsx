import { AppShell } from '@/components/layout/app-shell';

export default function TermsPage() {
  return (
    <AppShell variant="landing" showAuthControls>
      <section className="mx-auto max-w-3xl py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Términos de Servicio</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Uso personal no comercial. No garantizamos resultados de entrenamiento. No
          compartas credenciales. El servicio puede cambiar sin previo aviso.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-neutral-700">
          <li>Contenido con fines informativos, no asesoría médica.</li>
          <li>Debes ser mayor de edad o contar con supervisión.</li>
          <li>Nos reservamos el derecho de suspender cuentas por abuso.</li>
          <li>Reporta problemas y fallos; trabajamos para solucionarlos.</li>
        </ul>
      </section>
    </AppShell>
  );
}