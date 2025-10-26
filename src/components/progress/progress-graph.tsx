'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Weight, Zap, BarChart3 } from 'lucide-react';
import { ProgressDataPoint } from '@/types/workout';
import { DUMMY_PROGRESS_DATA } from '@/lib/dummy-data';

type MetricType = 'weight' | 'bodyFat' | 'squat' | 'bench' | 'volume';

interface MetricConfig {
  key: MetricType;
  title: string;
  description: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  areaColor: string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'weight',
    title: 'Peso Corporal',
    description: 'Evolución de peso en kg',
    unit: 'kg',
    icon: <Weight className="h-4 w-4" />,
    color: '#3b82f6',
    areaColor: '#3b82f620'
  },
  {
    key: 'bodyFat',
    title: 'Grasa Corporal',
    description: 'Porcentaje de grasa',
    unit: '%',
    icon: <Activity className="h-4 w-4" />,
    color: '#10b981',
    areaColor: '#10b98120'
  },
  {
    key: 'squat',
    title: 'Sentadilla (1RM)',
    description: 'Progreso en sentadilla',
    unit: 'kg',
    icon: <Zap className="h-4 w-4" />,
    color: '#f59e0b',
    areaColor: '#f59e0b20'
  },
  {
    key: 'bench',
    title: 'Press Banca (1RM)',
    description: 'Progreso en press banca',
    unit: 'kg',
    icon: <Zap className="h-4 w-4" />,
    color: '#ef4444',
    areaColor: '#ef444420'
  },
  {
    key: 'volume',
    title: 'Volumen Semanal',
    description: 'Kg totales levantados',
    unit: 'kg',
    icon: <BarChart3 className="h-4 w-4" />,
    color: '#8b5cf6',
    areaColor: '#8b5cf620'
  }
];

export function ProgressGraph() {
  const [activeMetric, setActiveMetric] = useState<MetricType>('weight');

  const metric = METRICS.find(m => m.key === activeMetric)!;
  const data = DUMMY_PROGRESS_DATA[activeMetric];

  // Calculate stats
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const change = lastValue - firstValue;
  const changePercent = firstValue !== 0 ? ((change / firstValue) * 100) : 0;
  const isPositive = change > 0;

  // For body weight and body fat, negative change is good
  const isGoodChange = (activeMetric === 'weight' || activeMetric === 'bodyFat')
    ? change < 0
    : change > 0;

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <Button
            key={m.key}
            variant={activeMetric === m.key ? 'default' : 'outline'}
            onClick={() => setActiveMetric(m.key)}
            className="flex items-center gap-2"
          >
            {m.icon}
            <span className="hidden sm:inline">{m.title}</span>
          </Button>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {metric.icon}
                {metric.title}
              </CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {lastValue.toFixed(1)} {metric.unit}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                isGoodChange ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {change > 0 ? '+' : ''}{change.toFixed(1)} {metric.unit}
                  ({changePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`color${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} ${metric.unit}`, metric.title]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={metric.color}
                  strokeWidth={2}
                  fill={`url(#color${activeMetric})`}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valor Inicial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {firstValue.toFixed(1)} {metric.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data[0]?.date}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valor Actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastValue.toFixed(1)} {metric.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data[data.length - 1]?.date}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cambio Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              isGoodChange ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)} {metric.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {changePercent.toFixed(1)}% de cambio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant={isGoodChange ? 'default' : 'secondary'}>
                {isGoodChange ? 'Positivo' : 'Mantener'}
              </Badge>
              <p className="text-sm text-muted-foreground flex-1">
                {activeMetric === 'weight' && (
                  <>Has perdido {Math.abs(change).toFixed(1)} kg en {data.length} semanas, lo que equivale a aproximadamente {(Math.abs(change) / data.length * 4).toFixed(2)} kg por mes. Ritmo saludable.</>
                )}
                {activeMetric === 'bodyFat' && (
                  <>Tu grasa corporal ha bajado {Math.abs(change).toFixed(1)}%, indicando buena composición corporal mientras mantienes masa muscular.</>
                )}
                {activeMetric === 'squat' && (
                  <>Has mejorado {change.toFixed(1)} kg en sentadilla, mostrando progreso constante en fuerza de piernas.</>
                )}
                {activeMetric === 'bench' && (
                  <>Tu press banca ha aumentado {change.toFixed(1)} kg, demostrando mejora en fuerza de empuje.</>
                )}
                {activeMetric === 'volume' && (
                  <>El volumen total ha incrementado en {change.toFixed(0)} kg, reflejando mayor capacidad de trabajo.</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
