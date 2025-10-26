'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { rescheduleWorkout } from '@/app/actions/workout';
import { useTrack } from '@/lib/hooks/use-track';

interface RescheduleControlProps {
  workoutId: string;
  scheduledAt: Date;
}

export function RescheduleControl({ workoutId, scheduledAt }: RescheduleControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const track = useTrack();
  const [value, setValue] = useState<string>(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date(scheduledAt);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  });

  const submit = () => {
    startTransition(async () => {
      track('reschedule_workout');
      await rescheduleWorkout(workoutId, new Date(value).toISOString());
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal"
      />
      <Button size="sm" variant="outline" onClick={submit} disabled={isPending} className="rounded-full">
        {isPending ? 'Guardando…' : 'Reprogramar'}
      </Button>
    </div>
  );
}