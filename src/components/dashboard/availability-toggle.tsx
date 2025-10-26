'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AvailabilityToggleProps {
  exerciseId: string;
}

export function AvailabilityToggle({ exerciseId }: AvailabilityToggleProps) {
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`exercise:${exerciseId}:na`);
    setUnavailable(stored === 'true');
  }, [exerciseId]);

  const toggle = () => {
    const next = !unavailable;
    setUnavailable(next);
    localStorage.setItem(`exercise:${exerciseId}:na`, String(next));
  };

  return (
    <div className="flex items-center gap-2">
      {unavailable ? <Badge variant="outline">No disponible</Badge> : null}
      <Button variant="ghost" size="sm" onClick={toggle}>
        {unavailable ? 'Marcar disponible' : 'Marcar no disponible'}
      </Button>
    </div>
  );
}
