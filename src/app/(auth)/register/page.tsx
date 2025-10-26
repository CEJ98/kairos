import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { RegisterForm, type RegisterFormState } from '@/components/forms/register-form';
import { registerUser } from '@/server/actions/auth';

async function registerAction(_state: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  'use server';

  try {
    await registerUser({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    });
    redirect('/login?registered=1');
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'No se pudo crear la cuenta'
    };
  }
}

export default function RegisterPage() {
  return (
    <AppShell variant="landing">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl bg-white/80 p-10 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-display text-3xl font-bold">Únete a Kairos</h1>
          <p className="text-sm text-neutral-500">
            Diseña planes periodizados y conecta tus métricas con decisiones inteligentes.
          </p>
        </div>
        <RegisterForm action={registerAction} />
      </div>
    </AppShell>
  );
}
