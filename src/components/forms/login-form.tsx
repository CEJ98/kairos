'use client';

import { useForm } from 'react-hook-form';
import type { infer as ZodInfer } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<ZodInfer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password
    });

    if (result?.error) {
      setError('Credenciales inválidas');
      return;
    }

    window.location.href = '/progress';
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-600" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent-teal"
          placeholder="tu@correo.com"
          {...register('email')}
        />
        {errors.email ? (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-600" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent-teal"
          placeholder="********"
          {...register('password')}
        />
        {errors.password ? (
          <span className="text-xs text-red-500">{errors.password.message}</span>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2">
        {isSubmitting ? 'Accediendo...' : 'Iniciar sesión'}
      </Button>
      <Button type="button" variant="outline" asChild>
        <a href="/register">Crear cuenta</a>
      </Button>
    </form>
  );
}
