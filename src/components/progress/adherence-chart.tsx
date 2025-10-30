'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdherenceData } from '@/types/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdherenceChartProps {
  data: AdherenceData[];
}

export function AdherenceChart({ data }: AdherenceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Adherencia</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calcular promedio y tendencia
  const avgAdherence = Math.round(
    data.reduce((sum, d) => sum + d.adherence, 0) / data.length
  );

  const firstHalf = data.slice(0, Math.ceil(data.length / 2));
  const secondHalf = data.slice(Math.ceil(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.adherence, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.adherence, 0) / secondHalf.length;

  const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable';
  const trendPercentage = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-poppins">Adherencia</CardTitle>
            <CardDescription>Sesiones completadas vs programadas</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{avgAdherence}%</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {trend === 'up' && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">+{trendPercentage}%</span>
                </>
              )}
              {trend === 'down' && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">-{trendPercentage}%</span>
                </>
              )}
              {trend === 'stable' && (
                <>
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span>Estable</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis
              dataKey="week"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'adherence') {
                  return [
                    `${value}% (${props.payload.completed}/${props.payload.planned})`,
                    'Adherencia'
                  ];
                }
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="adherence"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#adherenceGradient)"
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">Completadas</p>
            <p className="text-2xl font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.completed, 0)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Programadas</p>
            <p className="text-2xl font-bold text-gray-600">
              {data.reduce((sum, d) => sum + d.planned, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
