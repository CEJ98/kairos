import { LoginForm } from '@/components/forms/login-form';
import { AppShell } from '@/components/layout/app-shell';

export default function LoginPage() {
  return (
    <AppShell variant="landing">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-3xl bg-white/80 p-10 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-display text-3xl font-bold">Bienvenido de nuevo</h1>
          <p className="text-sm text-neutral-500">
            Accede para continuar con tu ciclo de entrenamiento inteligente.
          </p>
        </div>
        <LoginForm />
      </div>
    </AppShell>
  );
}
