'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StrengthData } from '@/app/actions/progress-actions';
import { useMemo } from 'react';

interface StrengthChartProps {
  data: StrengthData[];
}

export function StrengthChart({ data }: StrengthChartProps) {
  // Agrupar datos por ejercicio
  const exerciseData = useMemo(() => {
    const grouped = new Map<string, StrengthData[]>();

    data.forEach(item => {
      const existing = grouped.get(item.exercise) || [];
      grouped.set(item.exercise, [...existing, item]);
    });

    return grouped;
  }, [data]);

  // Preparar datos para el gráfico combinando todos los ejercicios por fecha
  const chartData = useMemo(() => {
    const dateMap = new Map<string, any>();

    data.forEach(item => {
      const existing = dateMap.get(item.date) || { date: item.date };
      existing[item.exercise] = item.oneRepMax;
      dateMap.set(item.date, existing);
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>1RM Estimado</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Colores para diferentes ejercicios
  const exerciseColors: { [key: string]: string } = {
    'Back Squat con Barra': '#3B82F6',
    'Press Banca': '#10B981',
    'Peso Muerto Rumano': '#F59E0B',
    'Press Militar': '#8B5CF6',
    'Dominadas': '#EC4899',
  };

  // Obtener ejercicios únicos
  const exercises = Array.from(exerciseData.keys());

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="font-poppins">1RM Estimado</CardTitle>
        <CardDescription>Progresión de fuerza en ejercicios principales</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <defs>
              {exercises.map((exercise, idx) => (
                <linearGradient key={exercise} id={`strength${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={exerciseColors[exercise] || '#6B7280'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={exerciseColors[exercise] || '#6B7280'}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
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
              tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`${value}kg`, '']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            {exercises.slice(0, 5).map((exercise, idx) => (
              <Line
                key={exercise}
                type="monotone"
                dataKey={exercise}
                stroke={exerciseColors[exercise] || '#6B7280'}
                strokeWidth={2}
                dot={{ fill: exerciseColors[exercise] || '#6B7280', r: 4 }}
                activeDot={{ r: 6 }}
                name={exercise}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {exercises.slice(0, 6).map(exercise => {
            const exerciseRecords = exerciseData.get(exercise) || [];
            const latestRecord = exerciseRecords[exerciseRecords.length - 1];
            const firstRecord = exerciseRecords[0];
            const improvement = latestRecord && firstRecord
              ? ((latestRecord.oneRepMax - firstRecord.oneRepMax) / firstRecord.oneRepMax) * 100
              : 0;

            return (
              <div
                key={exercise}
                className="rounded-lg border p-4"
                style={{ borderColor: exerciseColors[exercise] || '#E5E7EB' }}
              >
                <p className="text-sm font-medium text-muted-foreground truncate">{exercise}</p>
                <p className="text-2xl font-bold mt-1">
                  {latestRecord?.oneRepMax || 0}kg
                </p>
                {improvement !== 0 && (
                  <p className={`text-sm mt-1 ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
