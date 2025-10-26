'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ruler } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BodyMeasurementsData } from '@/app/actions/metrics-actions';

interface MeasurementsRadarProps {
  data: BodyMeasurementsData | null;
  previousData?: BodyMeasurementsData | null;
}

export function MeasurementsRadar({ data, previousData }: MeasurementsRadarProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins">Medidas Corporales</CardTitle>
          <CardDescription>No hay medidas registradas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-sm text-gray-500">
          <div className="text-center">
            <Ruler className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Registra tus medidas para visualizar tu progreso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for radar chart
  const measurements = [
    { name: 'Pecho', key: 'chest', current: data.chest, previous: previousData?.chest },
    { name: 'Cintura', key: 'waist', current: data.waist, previous: previousData?.waist },
    { name: 'Cadera', key: 'hips', current: data.hips, previous: previousData?.hips },
    { name: 'Hombros', key: 'shoulders', current: data.shoulders, previous: previousData?.shoulders },
    { name: 'Brazo Izq', key: 'leftArm', current: data.leftArm, previous: previousData?.leftArm },
    { name: 'Brazo Der', key: 'rightArm', current: data.rightArm, previous: previousData?.rightArm },
    { name: 'Muslo Izq', key: 'leftThigh', current: data.leftThigh, previous: previousData?.leftThigh },
    { name: 'Muslo Der', key: 'rightThigh', current: data.rightThigh, previous: previousData?.rightThigh },
  ].filter((m) => m.current !== null);

  const radarData = measurements.map((m) => ({
    measurement: m.name,
    actual: m.current,
    anterior: m.previous,
  }));

  // Calculate changes
  const changes = measurements.map((m) => {
    if (!m.previous || !m.current) return null;
    const change = m.current - m.previous;
    return {
      name: m.name,
      change: change.toFixed(1),
      positive: change > 0,
    };
  }).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-poppins">Medidas Corporales</CardTitle>
        <CardDescription>
          Registrado el {format(data.date, "d 'de' MMMM yyyy", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="measurement"
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'auto']}
              tick={{ fill: '#6B7280', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: number, name: string) => {
                const labels: { [key: string]: string } = {
                  actual: 'Actual',
                  anterior: 'Anterior',
                };
                return [`${value} cm`, labels[name] || name];
              }}
            />
            {previousData && (
              <Radar
                name="Anterior"
                dataKey="anterior"
                stroke="#94A3B8"
                fill="#94A3B8"
                fillOpacity={0.3}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            <Radar
              name="Actual"
              dataKey="actual"
              stroke="#8B5CF6"
              fill="url(#radarGradient)"
              fillOpacity={0.6}
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', r: 4 }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Measurements List */}
        <div className="mt-6 space-y-2">
          {measurements.map((m) => (
            <div
              key={m.key}
              className="flex items-center justify-between rounded-lg bg-purple-50 px-4 py-2"
            >
              <span className="text-sm font-medium text-purple-900">{m.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-purple-700">{m.current} cm</span>
                {m.previous && (
                  <span className="text-xs text-purple-600">
                    {m.current! - m.previous > 0 ? '+' : ''}
                    {(m.current! - m.previous).toFixed(1)} cm
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Changes Summary */}
        {changes.length > 0 && (
          <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-3">
              Cambios desde el último registro
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {changes.map((change) => (
                <div key={change!.name} className="text-center">
                  <p className="text-xs text-purple-700">{change!.name}</p>
                  <p
                    className={`text-sm font-bold ${
                      change!.positive ? 'text-orange-600' : 'text-green-600'
                    }`}
                  >
                    {change!.change} cm
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
