'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createPlan } from '@/app/actions/plan';
import { useTrack } from '@/lib/hooks/use-track';

interface CreatePlanButtonProps {
  userId: string;
}

export function CreatePlanButton({ userId }: CreatePlanButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const track = useTrack();

  const handleCreate = () => {
    startTransition(async () => {
      track('create_plan');
      await createPlan({
        userId,
        goal: 'hipertrofia',
        frequency: 4,
        experience: 'intermedio',
        availableEquipment: [],
        restrictions: []
      });
      router.push('/workout/next');
      router.refresh();
    });
  };

  return (
    <Button onClick={handleCreate} className="w-full rounded-full" disabled={isPending}>
      {isPending ? 'Creando plan…' : 'Crear plan rápido'}
    </Button>
  );
}