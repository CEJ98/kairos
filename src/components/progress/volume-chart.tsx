'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VolumeData } from '@/app/actions/progress-actions';

interface VolumeChartProps {
  data: VolumeData[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volumen de Entrenamiento</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Colores gradientes para las barras
  const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-poppins">Volumen Semanal</CardTitle>
        <CardDescription>Total de volumen (peso × reps) por semana</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis
              dataKey="date"
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'totalVolume') return [`${value.toLocaleString()}kg`, 'Volumen Total'];
                if (name === 'sets') return [`${value} series`, 'Series'];
                if (name === 'reps') return [`${value} reps`, 'Repeticiones'];
                return [value, name];
              }}
            />
            <Bar
              dataKey="totalVolume"
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Series</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.sets, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Reps</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.reps, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Promedio Semanal</p>
            <p className="text-2xl font-bold">
              {Math.round(data.reduce((sum, d) => sum + d.totalVolume, 0) / data.length).toLocaleString()}kg
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
