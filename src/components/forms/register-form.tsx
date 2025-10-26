'use client';

import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';

export interface RegisterFormState {
  error?: string;
}

interface RegisterFormProps {
  action: (state: RegisterFormState, formData: FormData) => Promise<RegisterFormState>;
}

const initialState: RegisterFormState = {};

export function RegisterForm({ action }: RegisterFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-600" htmlFor="name">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent-teal"
          placeholder="Tu nombre"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-600" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent-teal"
          placeholder="tu@correo.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-600" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent-teal"
          placeholder="********"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-600" htmlFor="confirmPassword">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent-teal"
          placeholder="********"
        />
      </div>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      <Button type="submit" size="lg" className="gap-2">
        Crear cuenta
      </Button>
      <Button variant="outline" asChild>
        <a href="/login">Ya tengo cuenta</a>
      </Button>
    </form>
  );
}
