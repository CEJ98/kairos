/**
 * Enhanced Charts Components for Kairos Fitness
 * Beautiful, interactive charts for fitness data visualization
 */

'use client'

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

// Color schemes for different chart types
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  emerald: '#059669'
}

const GRADIENT_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.emerald,
  COLORS.danger
]

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      {label && (
        <p className="font-medium text-gray-900 dark:text-white mb-2">
          {formatter ? formatter(label) : label}
        </p>
      )}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Progress Line Chart for workout progress over time
interface ProgressLineChartProps {
  data: Array<{
    date: string
    weight?: number
    reps?: number
    duration?: number
    [key: string]: any
  }>
  title: string
  description?: string
  className?: string
  height?: number
  dataKeys: string[]
  colors?: string[]
  showGrid?: boolean
  showDots?: boolean
}

export function ProgressLineChart({ 
  data, 
  title, 
  description, 
  className, 
  height = 300,
  dataKeys,
  colors = [COLORS.primary, COLORS.secondary],
  showGrid = true,
  showDots = true
}: ProgressLineChartProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline" className="text-xs">
            {data.length} puntos
          </Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={showDots ? { r: 4 } : false}
                activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Workout Volume Area Chart
interface VolumeAreaChartProps {
  data: Array<{
    date: string
    volume: number
    sets: number
    reps: number
  }>
  title: string
  className?: string
  height?: number
}

export function VolumeAreaChart({ data, title, className, height = 300 }: VolumeAreaChartProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Volumen total de entrenamiento</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="volume"
              stroke={COLORS.primary}
              fillOpacity={1}
              fill="url(#volumeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Exercise Distribution Pie Chart
interface ExerciseDistributionProps {
  data: Array<{
    name: string
    value: number
    category: string
  }>
  title: string
  className?: string
  height?: number
}

export function ExerciseDistributionChart({ data, title, className, height = 300 }: ExerciseDistributionProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Distribución de ejercicios por categoría</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Performance Radial Chart
interface PerformanceRadialProps {
  data: Array<{
    name: string
    value: number
    fill: string
  }>
  title: string
  className?: string
  height?: number
  centerValue?: number
  centerLabel?: string
}

export function PerformanceRadialChart({ 
  data, 
  title, 
  className, 
  height = 300,
  centerValue,
  centerLabel
}: PerformanceRadialProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Métricas de rendimiento</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="20%" 
            outerRadius="90%" 
            barSize={10} 
            data={data}
          >
            <RadialBar
              dataKey="value"
              fill="#8884d8"
            />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {centerValue}%
              </div>
              {centerLabel && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {centerLabel}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Combined Workout Metrics Chart
interface CombinedMetricsProps {
  data: Array<{
    date: string
    duration: number
    calories: number
    exercises: number
  }>
  title: string
  className?: string
  height?: number
}

export function CombinedMetricsChart({ data, title, className, height = 350 }: CombinedMetricsProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Métricas combinadas de entrenamiento</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis yAxisId="left" className="text-xs" />
            <YAxis yAxisId="right" orientation="right" className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Duration as area */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="duration"
              fill={COLORS.primary}
              stroke={COLORS.primary}
              fillOpacity={0.3}
            />
            
            {/* Calories as bars */}
            <Bar yAxisId="right" dataKey="calories" fill={COLORS.secondary} opacity={0.8} />
            
            {/* Exercises as line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="exercises"
              stroke={COLORS.accent}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Weekly Progress Bar Chart
interface WeeklyProgressProps {
  data: Array<{
    day: string
    workouts: number
    planned: number
  }>
  title: string
  className?: string
  height?: number
}

export function WeeklyProgressChart({ data, title, className, height = 300 }: WeeklyProgressProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Progreso semanal vs planificado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="day" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="planned" fill={COLORS.secondary} opacity={0.3} name="Planificado" />
            <Bar dataKey="workouts" fill={COLORS.primary} name="Completado" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Export all chart components
export {
  CustomTooltip,
  COLORS,
  GRADIENT_COLORS
}