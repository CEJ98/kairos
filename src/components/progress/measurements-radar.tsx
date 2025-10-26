'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type MeasurementPoint = { metric: string; value: number };

export function MeasurementsRadar({ data }: { data: MeasurementPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medidas Corporales</CardTitle>
        <CardDescription>Radar chart de cuello, cintura y cadera</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, Math.max(...data.map(d => d.value)) || 100]} />
              <Tooltip />
              <Legend />
              <Radar name="Medidas (cm)" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}