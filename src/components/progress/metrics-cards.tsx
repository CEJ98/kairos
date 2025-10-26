'use client';

import { Card } from '@/components/ui/card';

export interface MetricsCardsProps {
  prsCount: number;
  daysCompleted: number;
  totalVolume: number; // kg * reps
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('es-MX').format(Math.round(n));
}

export function MetricsCards({ prsCount, daysCompleted, totalVolume }: MetricsCardsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <Card className="rounded-2xl p-5 shadow-soft">
        <div className="text-sm text-neutral-500">PRs logrados</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{formatNumber(prsCount)}</div>
      </Card>
      <Card className="rounded-2xl p-5 shadow-soft">
        <div className="text-sm text-neutral-500">Días completados</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{formatNumber(daysCompleted)}</div>
      </Card>
      <Card className="rounded-2xl p-5 shadow-soft">
        <div className="text-sm text-neutral-500">Volumen total</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{formatNumber(totalVolume)} kg·reps</div>
      </Card>
    </div>
  );
}