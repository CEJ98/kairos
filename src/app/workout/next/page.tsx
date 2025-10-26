import { redirect } from 'next/navigation';
import { nextWorkout } from '@/server/actions/plan';
import { authSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';

export default async function NextWorkoutPage() {
  const session = await authSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const upcoming = await nextWorkout(session.user.id);
  if (upcoming) {
    redirect(`/workout/${upcoming.workoutId}`);
  }

  return (
    <AppShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Sin sesiones pendientes</h1>
        <p className="text-sm text-neutral-500">
          Completa un ciclo de entrenamiento o crea un nuevo plan para continuar.
        </p>
        <Button asChild>
          <a href="/progress">Ir al progreso</a>
        </Button>
      </div>
    </AppShell>
  );
}
