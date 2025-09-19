'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalytics } from '@/lib/analytics-client';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import {
	TrendingUp,
	Users,
	Activity,
	Clock,
	Target,
	BarChart3,
	PieChart as PieChartIcon,
	Calendar,
	Download,
	RefreshCw
} from 'lucide-react';

// Tipos para datos de analytics
interface AnalyticsData {
	users: {
		total: number;
		active: number;
		new: number;
		retention: number;
	};
	workouts: {
		total: number;
		completed: number;
		avgDuration: number;
		completionRate: number;
	};
	pages: {
		views: number;
		uniqueViews: number;
		avgTimeOnPage: number;
		bounceRate: number;
	};
	performance: {
		avgLoadTime: number;
		errorRate: number;
		api: {
			avgResponseTime: number;
			errorRate: number;
		};
	};
}

interface ChartData {
	name: string;
	value: number;
	label?: string;
	color?: string;
}

interface TimeSeriesData {
	date: string;
	users: number;
	workouts: number;
	pageViews: number;
	conversions: number;
}

// Datos mock para desarrollo
const mockAnalyticsData: AnalyticsData = {
	users: {
		total: 1247,
		active: 892,
		new: 156,
		retention: 78.5
	},
	workouts: {
		total: 3421,
		completed: 2876,
		avgDuration: 45.2,
		completionRate: 84.1
	},
	pages: {
		views: 15678,
		uniqueViews: 8934,
		avgTimeOnPage: 3.4,
		bounceRate: 32.1
	},
	performance: {
		avgLoadTime: 1.2,
		errorRate: 0.8,
		api: {
			avgResponseTime: 245,
			errorRate: 1.2
		}
	}
};

const mockTimeSeriesData: TimeSeriesData[] = [
	{ date: '2024-01-01', users: 120, workouts: 340, pageViews: 1200, conversions: 45 },
	{ date: '2024-01-02', users: 135, workouts: 380, pageViews: 1350, conversions: 52 },
	{ date: '2024-01-03', users: 148, workouts: 420, pageViews: 1480, conversions: 58 },
	{ date: '2024-01-04', users: 162, workouts: 390, pageViews: 1620, conversions: 61 },
	{ date: '2024-01-05', users: 178, workouts: 450, pageViews: 1780, conversions: 67 },
	{ date: '2024-01-06', users: 195, workouts: 480, pageViews: 1950, conversions: 73 },
	{ date: '2024-01-07', users: 210, workouts: 520, pageViews: 2100, conversions: 79 }
];

const mockTopPages: ChartData[] = [
	{ name: 'Dashboard', value: 3245, color: '#8884d8' },
	{ name: 'Rutinas', value: 2876, color: '#82ca9d' },
	{ name: 'Progreso', value: 2134, color: '#ffc658' },
	{ name: 'Nutrición', value: 1567, color: '#ff7300' },
	{ name: 'Perfil', value: 1234, color: '#00ff88' }
];

const mockDeviceTypes: ChartData[] = [
	{ name: 'Móvil', value: 65, color: '#8884d8' },
	{ name: 'Desktop', value: 28, color: '#82ca9d' },
	{ name: 'Tablet', value: 7, color: '#ffc658' }
];

// Componente de métrica individual
interface MetricCardProps {
	title: string;
	value: string | number;
	change?: number;
	icon: React.ReactNode;
	description?: string;
	format?: 'number' | 'percentage' | 'duration' | 'currency';
}

function MetricCard({ title, value, change, icon, description, format = 'number' }: MetricCardProps) {
	const formatValue = (val: string | number) => {
		if (typeof val === 'string') return val;
		
		switch (format) {
			case 'percentage':
				return `${val.toFixed(1)}%`;
			case 'duration':
				return `${val.toFixed(1)}min`;
			case 'currency':
				return `$${val.toLocaleString()}`;
			default:
				return val.toLocaleString();
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<div className="h-4 w-4 text-muted-foreground">{icon}</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{formatValue(value)}</div>
				{change !== undefined && (
					<p className={cn(
						"text-xs flex items-center gap-1",
						change >= 0 ? "text-green-600" : "text-red-600"
					)}>
						<TrendingUp className="h-3 w-3" />
						{change >= 0 ? '+' : ''}{change.toFixed(1)}% desde el mes pasado
					</p>
				)}
				{description && (
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

// Componente principal del dashboard
export default function AnalyticsDashboard() {
	const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
	const [timeRange, setTimeRange] = useState('7d');
	const [isLoading, setIsLoading] = useState(false);
	const { track } = useAnalytics();

	useEffect(() => {
		// Rastrear vista del dashboard
		track('analytics_dashboard_viewed', { timeRange });
	}, [track, timeRange]);

	const handleRefresh = async () => {
		setIsLoading(true);
		track('analytics_dashboard_refreshed');
		
		// Simular carga de datos
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
	};

	const handleExport = () => {
		track('analytics_data_exported', { timeRange, format: 'csv' });
		// Implementar exportación
		console.log('Exportando datos...');
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
					<p className="text-muted-foreground">
						Monitorea el rendimiento y uso de tu aplicación
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">Últimas 24h</SelectItem>
							<SelectItem value="7d">Últimos 7 días</SelectItem>
							<SelectItem value="30d">Últimos 30 días</SelectItem>
							<SelectItem value="90d">Últimos 90 días</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
						<RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
						Actualizar
					</Button>
					<Button variant="outline" onClick={handleExport}>
						<Download className="h-4 w-4 mr-2" />
						Exportar
					</Button>
				</div>
			</div>

			{/* Métricas principales */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Usuarios Totales"
					value={data.users.total}
					change={12.5}
					icon={<Users />}
					description={`${data.users.active} activos`}
				/>
				<MetricCard
					title="Workouts Completados"
					value={data.workouts.completed}
					change={8.2}
					icon={<Activity />}
					description={`${data.workouts.completionRate}% tasa de finalización`}
					format="number"
				/>
				<MetricCard
					title="Tiempo Promedio"
					value={data.workouts.avgDuration}
					change={-2.1}
					icon={<Clock />}
					description="Por sesión de entrenamiento"
					format="duration"
				/>
				<MetricCard
					title="Retención"
					value={data.users.retention}
					change={5.7}
					icon={<Target />}
					description="Usuarios que regresan"
					format="percentage"
				/>
			</div>

			{/* Gráficas y análisis detallado */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Resumen</TabsTrigger>
					<TabsTrigger value="users">Usuarios</TabsTrigger>
					<TabsTrigger value="workouts">Entrenamientos</TabsTrigger>
					<TabsTrigger value="performance">Rendimiento</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Tendencia de Usuarios</CardTitle>
								<CardDescription>
									Crecimiento de usuarios en los últimos 7 días
								</CardDescription>
							</CardHeader>
							<CardContent>
                    <AreaUsersChart data={mockTimeSeriesData.map(d => ({ date: d.date, users: d.users }))} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Páginas Más Visitadas</CardTitle>
								<CardDescription>
									Distribución de vistas por página
								</CardDescription>
							</CardHeader>
							<CardContent>
                    <PieTopPages data={mockTopPages} />
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="users" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<MetricCard
							title="Usuarios Nuevos"
							value={data.users.new}
							change={15.2}
							icon={<Users />}
							description="Esta semana"
						/>
						<Card>
							<CardHeader>
								<CardTitle>Tipos de Dispositivo</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{mockDeviceTypes.map((device, index) => (
										<div key={index} className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div 
													className="w-3 h-3 rounded-full" 
													style={{ backgroundColor: device.color }}
												/>
												<span className="text-sm">{device.name}</span>
											</div>
											<Badge variant="secondary">{device.value}%</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="workouts" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Actividad de Entrenamientos</CardTitle>
							<CardDescription>
								Tendencia de entrenamientos completados
							</CardDescription>
						</CardHeader>
						<CardContent>
                    <LineWorkoutsChart data={mockTimeSeriesData.map(d => ({ date: d.date, workouts: d.workouts }))} />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<MetricCard
							title="Tiempo de Carga"
							value={`${data.performance.avgLoadTime}s`}
							change={-8.5}
							icon={<Clock />}
							description="Promedio de páginas"
						/>
						<MetricCard
							title="Tasa de Error"
							value={data.performance.errorRate}
							change={2.1}
							icon={<BarChart3 />}
							description="Errores por sesión"
							format="percentage"
						/>
						<MetricCard
							title="API Response"
							value={`${data.performance.api.avgResponseTime}ms`}
							change={-12.3}
							icon={<Activity />}
							description="Tiempo promedio"
						/>
						<MetricCard
							title="Uptime"
							value="99.9"
							change={0.1}
							icon={<Target />}
							description="Disponibilidad del servicio"
							format="percentage"
						/>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
const AreaUsersChart = dynamic(() => import('./DashboardCharts.client').then(m => m.AreaUsersChart), { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-md bg-muted" /> })
const PieTopPages = dynamic(() => import('./DashboardCharts.client').then(m => m.PieTopPages), { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-md bg-muted" /> })
const LineWorkoutsChart = dynamic(() => import('./DashboardCharts.client').then(m => m.LineWorkoutsChart), { ssr: false, loading: () => <div className="h-[400px] animate-pulse rounded-md bg-muted" /> })