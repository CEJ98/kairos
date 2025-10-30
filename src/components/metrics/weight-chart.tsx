'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { BodyWeightData } from '@/types/metrics';

interface WeightChartProps {
  data: BodyWeightData[];
}

export function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins">Historial de Peso</CardTitle>
          <CardDescription>No hay datos de peso registrados</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-sm text-gray-500">
          Comienza registrando tu peso para ver tu progreso
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((entry) => ({
    date: format(entry.date, 'dd MMM', { locale: es }),
    fullDate: format(entry.date, "d 'de' MMMM", { locale: es }),
    weight: entry.weight,
    bodyFat: entry.bodyFat,
    muscleMass: entry.muscleMass,
  }));

  // Calculate trends
  const firstWeight = data[0].weight;
  const lastWeight = data[data.length - 1].weight;
  const weightChange = lastWeight - firstWeight;
  const weightChangePercent = ((weightChange / firstWeight) * 100).toFixed(1);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(weightChange) > 0.5) {
    trend = weightChange > 0 ? 'up' : 'down';
  }

  // Calculate body fat trend if available
  const firstBodyFat = data.find((d) => d.bodyFat)?.bodyFat;
  const lastBodyFat = data[data.length - 1].bodyFat ?? data.slice().reverse().find((d) => d.bodyFat)?.bodyFat;
  const bodyFatChange = firstBodyFat && lastBodyFat ? lastBodyFat - firstBodyFat : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-poppins">Historial de Peso</CardTitle>
            <CardDescription>Últimos {data.length} registros</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">{lastWeight} kg</span>
              {trend === 'up' && <TrendingUp className="h-6 w-6 text-orange-500" />}
              {trend === 'down' && <TrendingDown className="h-6 w-6 text-green-500" />}
              {trend === 'stable' && <Minus className="h-6 w-6 text-gray-400" />}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span
                className={
                  trend === 'down'
                    ? 'text-green-600'
                    : trend === 'up'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }
              >
                {weightChange > 0 ? '+' : ''}
                {weightChange.toFixed(1)} kg ({weightChangePercent}%)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="muscleMassGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelFormatter={(value, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate;
                }
                return value;
              }}
              formatter={(value: number, name: string) => {
                const labels: { [key: string]: string } = {
                  weight: 'Peso',
                  bodyFat: 'Grasa Corporal',
                  muscleMass: 'Masa Muscular',
                };
                const unit = name === 'bodyFat' ? '%' : 'kg';
                return [
                  `${value.toFixed(1)} ${unit}`,
                  labels[name] || name,
                ];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const labels: { [key: string]: string } = {
                  weight: 'Peso',
                  bodyFat: 'Grasa Corporal',
                  muscleMass: 'Masa Muscular',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              fill="url(#weightGradient)"
            />
            {data.some((d) => d.bodyFat) && (
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 3 }}
                activeDot={{ r: 5 }}
                strokeDasharray="5 5"
              />
            )}
            {data.some((d) => d.muscleMass) && (
              <Line
                type="monotone"
                dataKey="muscleMass"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 3 }}
                activeDot={{ r: 5 }}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-600 uppercase">Peso Inicial</p>
            <p className="mt-1 text-lg font-bold text-blue-900">{firstWeight.toFixed(1)} kg</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-600 uppercase">Peso Actual</p>
            <p className="mt-1 text-lg font-bold text-blue-900">{lastWeight.toFixed(1)} kg</p>
          </div>
          {bodyFatChange !== null && (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-600 uppercase">Cambio Grasa</p>
              <p className="mt-1 text-lg font-bold text-amber-900">
                {bodyFatChange > 0 ? '+' : ''}
                {bodyFatChange.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
