'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { nextWorkout } from '@/app/actions/plan';
import { useTrack } from '@/lib/hooks/use-track';

interface StartNextWorkoutButtonProps {
  userId: string;
}

export function StartNextWorkoutButton({ userId }: StartNextWorkoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const track = useTrack();

  const handleStart = () => {
    startTransition(async () => {
      try {
        track('start_workout');
        const next = await nextWorkout(userId);
        router.push(`/workout/${next.workoutId}`);
        router.refresh();
      } catch (error) {
        router.push('/workout/next');
      }
    });
  };

  return (
    <Button onClick={handleStart} variant="accent" className="rounded-full px-4" disabled={isPending}>
      {isPending ? 'Abriendo…' : 'Start next workout'}
    </Button>
  );
}