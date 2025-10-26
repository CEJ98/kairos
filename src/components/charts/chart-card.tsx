'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

export interface ChartCardProps {
  title: string;
  description?: string;
  data: Array<{ label: string; value: number }>;
  accent?: 'teal' | 'coral' | 'green';
}

const accentPalette = {
  teal: '#3EC7C2',
  coral: '#FF6F61',
  green: '#81C784'
};

export function ChartCard({ title, description, data, accent = 'teal' }: ChartCardProps) {
  const color = accentPalette[accent];
  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-neutral-500">{description}</p> : null}
      </header>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${accent}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="rgba(15, 15, 15, 0.08)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} />
            <YAxis tickLine={false} axisLine={false} dx={-8} />
            <Tooltip cursor={{ stroke: color, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#fill-${accent})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
