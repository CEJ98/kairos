'use client';

import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

export interface AdherenceRingProps {
  title?: string;
  description?: string;
  value: number; // percentage 0-100
}

const TURQUOISE = '#3EC7C2';
const MINT = '#A7F3D0';

export function AdherenceRing({ title = 'Adherencia al plan', description = 'Sesiones completadas sobre plan', value }: AdherenceRingProps) {
  const data = [{ name: 'Adherence', value }];
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex-1">
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-neutral-500">{description}</p> : null}
      </div>
      <div className="h-32 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={90 + (value / 100) * 360}>
            <defs>
              <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={TURQUOISE} stopOpacity={0.95} />
                <stop offset="100%" stopColor={MINT} stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <RadialBar dataKey="value" cornerRadius={16} fill="url(#ringGradient)" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 text-center">
        <div className="text-3xl font-bold text-foreground">{Math.round(value)}%</div>
        <div className="text-xs text-neutral-500">último periodo</div>
      </div>
    </Card>
  );
}