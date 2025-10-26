'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

export interface OneRmBarsProps {
  title?: string;
  description?: string;
  data: Array<{ label: string; value: number }>;
}

const TURQUOISE = '#3EC7C2';
const MINT = '#A7F3D0';

export function OneRmBars({ title = '1RM estimado por ejercicio', description = 'Top ejercicios por fuerza estimada', data }: OneRmBarsProps) {
  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-neutral-500">{description}</p> : null}
      </header>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TURQUOISE} stopOpacity={0.9} />
                <stop offset="100%" stopColor={MINT} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="rgba(15,15,15,0.08)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} />
            <YAxis tickLine={false} axisLine={false} dx={-8} />
            <Tooltip cursor={{ fill: 'rgba(62,199,194,0.08)' }} />
            <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}