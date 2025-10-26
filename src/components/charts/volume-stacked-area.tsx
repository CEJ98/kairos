'use client';

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

export interface StackedVolumeProps {
  title?: string;
  description?: string;
  data: Array<Record<string, any>>; // dynamic keys per series plus label
  series: string[]; // keys to stack
}

const PALETTE = ['#3EC7C2', '#7AE2D6', '#A7F3D0', '#5AD4CC', '#8BEAD9'];

export function VolumeStackedArea({ title = 'Volumen por semana', description = 'Carga total por grupo muscular', data, series }: StackedVolumeProps) {
  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-neutral-500">{description}</p> : null}
      </header>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {series.map((key, i) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.06} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="rgba(15, 15, 15, 0.08)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} />
            <YAxis tickLine={false} axisLine={false} dx={-8} />
            <Tooltip cursor={{ stroke: '#3EC7C2', strokeWidth: 1 }} />
            <Legend verticalAlign="bottom" height={24} />
            {series.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                fill={`url(#fill-${key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}