'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';

interface ExportCsvButtonProps {
  action: (range: string) => Promise<string>;
  range: string;
}

export function ExportCsvButton({ action, range }: ExportCsvButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const csv = await action(range);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kairos-progress-${range}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      {isPending ? 'Generando...' : 'Exportar CSV'}
    </Button>
  );
}
