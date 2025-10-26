'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

interface DemoButtonProps {
  action: () => Promise<{ email: string; password: string }>;
}

export function DemoButton({ action }: DemoButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      setError(null);
      try {
        const credentials = await action();
        const result = await signIn('credentials', {
          redirect: false,
          email: credentials.email,
          password: credentials.password
        });
        if (result?.error) {
          setError('No se pudo iniciar la demo.');
          return;
        }
        window.location.href = '/progress';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear la demo');
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleClick} size="lg" variant="accent" disabled={isPending}>
        {isPending ? 'Preparando demo...' : 'Entrar con demo'}
      </Button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
