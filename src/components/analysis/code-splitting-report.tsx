'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Package, Zap, Target, TrendingUp, Code, Layers, Clock, FileText } from 'lucide-react';

interface BundleMetric {
	id: string;
	name: string;
	current: number;
	optimal: number;
	unit: string;
	status: 'good' | 'warning' | 'critical';
	impact: 'high' | 'medium' | 'low';
	description: string;
}

interface CodeSplittingStrategy {
	id: string;
	title: string;
	description: string;
	benefits: string[];
	implemented: boolean;
	priority: number;
	estimatedSavings: string;
	complexity: 'low' | 'medium' | 'high';
}

interface LazyLoadingOpportunity {
	id: string;
	component: string;
	path: string;
	currentSize: string;
	estimatedSavings: string;
	priority: 'high' | 'medium' | 'low';
	implemented: boolean;
}

const CodeSplittingReport: React.FC = () => {
	const bundleMetrics: BundleMetric[] = [
		{
			id: 'main-bundle-size',
			name: 'Tamaño Bundle Principal',
			current: 2.8,
			optimal: 1.5,
			unit: 'MB',
			status: 'warning',
			impact: 'high',
			description: 'Bundle principal demasiado grande, afecta FCP'
		},
		{
			id: 'chunk-count',
			name: 'Número de Chunks',
			current: 12,
			optimal: 25,
			unit: 'chunks',
			status: 'warning',
			impact: 'medium',
			description: 'Pocos chunks, oportunidad de división granular'
		},
		{
			id: 'lazy-loading-coverage',
			name: 'Cobertura Lazy Loading',
			current: 65,
			optimal: 90,
			unit: '%',
			status: 'warning',
			impact: 'high',
			description: 'Muchos componentes se cargan innecesariamente'
		},
		{
			id: 'tree-shaking-efficiency',
			name: 'Eficiencia Tree Shaking',
			current: 78,
			optimal: 95,
			unit: '%',
			status: 'good',
			impact: 'medium',
			description: 'Buen tree shaking, algunas mejoras posibles'
		},
		{
			id: 'dynamic-imports',
			name: 'Uso de Dynamic Imports',
			current: 45,
			optimal: 80,
			unit: '%',
			status: 'critical',
			impact: 'high',
			description: 'Bajo uso de importaciones dinámicas'
		},
		{
			id: 'vendor-splitting',
			name: 'División de Vendors',
			current: 70,
			optimal: 85,
			unit: '%',
			status: 'good',
			impact: 'medium',
			description: 'Buena separación de librerías externas'
		}
	];

	const strategies: CodeSplittingStrategy[] = [
		{
			id: 'route-based-splitting',
			title: 'División por Rutas',
			description: 'Dividir código por páginas y rutas principales usando Next.js App Router',
			benefits: [
				'Carga inicial más rápida',
				'Mejor cache por ruta',
				'Navegación más fluida'
			],
			implemented: true,
			priority: 1,
			estimatedSavings: '40-60%',
			complexity: 'low'
		},
		{
			id: 'component-lazy-loading',
			title: 'Lazy Loading de Componentes',
			description: 'Cargar componentes pesados solo cuando son necesarios',
			benefits: [
				'Reduce bundle inicial',
				'Mejora Time to Interactive',
				'Optimiza memoria'
			],
			implemented: false,
			priority: 2,
			estimatedSavings: '25-35%',
			complexity: 'medium'
		},
		{
			id: 'vendor-chunk-optimization',
			title: 'Optimización de Chunks de Vendors',
			description: 'Separar librerías por frecuencia de cambio y tamaño',
			benefits: [
				'Mejor cache de librerías',
				'Actualizaciones más eficientes',
				'Paralelización de descargas'
			],
			implemented: false,
			priority: 3,
			estimatedSavings: '15-25%',
			complexity: 'medium'
		},
		{
			id: 'feature-based-splitting',
			title: 'División por Características',
			description: 'Agrupar código por funcionalidades específicas (dashboard, auth, etc.)',
			benefits: [
				'Carga contextual',
				'Mejor organización',
				'Facilita mantenimiento'
			],
			implemented: false,
			priority: 4,
			estimatedSavings: '20-30%',
			complexity: 'high'
		},
		{
			id: 'micro-frontend-approach',
			title: 'Enfoque Micro-Frontend',
			description: 'Dividir la aplicación en módulos independientes',
			benefits: [
				'Escalabilidad extrema',
				'Desarrollo independiente',
				'Despliegues granulares'
			],
			implemented: false,
			priority: 5,
			estimatedSavings: '30-50%',
			complexity: 'high'
		}
	];

	const lazyLoadingOpportunities: LazyLoadingOpportunity[] = [
		{
			id: 'dashboard-charts',
			component: 'Dashboard Charts',
			path: '/components/dashboard/*',
			currentSize: '450KB',
			estimatedSavings: '400KB',
			priority: 'high',
			implemented: false
		},
		{
			id: 'admin-panel',
			component: 'Admin Panel',
			path: '/app/admin/*',
			currentSize: '320KB',
			estimatedSavings: '320KB',
			priority: 'high',
			implemented: false
		},
		{
			id: 'settings-forms',
			component: 'Settings Forms',
			path: '/components/settings/*',
			currentSize: '280KB',
			estimatedSavings: '250KB',
			priority: 'medium',
			implemented: false
		},
		{
			id: 'notification-center',
			component: 'Notification Center',
			path: '/components/notifications/*',
			currentSize: '180KB',
			estimatedSavings: '160KB',
			priority: 'medium',
			implemented: true
		},
		{
			id: 'profile-editor',
			component: 'Profile Editor',
			path: '/components/profile/*',
			currentSize: '220KB',
			estimatedSavings: '200KB',
			priority: 'low',
			implemented: false
		}
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'good': return 'bg-green-500';
			case 'warning': return 'bg-yellow-500';
			case 'critical': return 'bg-red-500';
			default: return 'bg-gray-500';
		}
	};

	const getImpactColor = (impact: string) => {
		switch (impact) {
			case 'high': return 'destructive';
			case 'medium': return 'default';
			case 'low': return 'secondary';
			default: return 'default';
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'destructive';
			case 'medium': return 'default';
			case 'low': return 'secondary';
			default: return 'default';
		}
	};

	const overallScore = Math.round(
		bundleMetrics.reduce((acc, metric) => {
			const score = (metric.current / metric.optimal) * 100;
			return acc + (score > 100 ? 100 : score);
		}, 0) / bundleMetrics.length
	);

	const totalPotentialSavings = lazyLoadingOpportunities
		.filter(opp => !opp.implemented)
		.reduce((acc, opp) => acc + parseInt(opp.estimatedSavings.replace('KB', '')), 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">División de Código y Lazy Loading</h1>
					<p className="text-muted-foreground mt-2">
						Optimización avanzada del bundle y carga diferida de componentes
					</p>
				</div>
				<Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'} className="text-lg px-4 py-2">
					Puntuación: {overallScore}%
				</Badge>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Bundle Principal</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">2.8MB</div>
						<p className="text-xs text-muted-foreground">Objetivo: 1.5MB</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Lazy Loading</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">65%</div>
						<p className="text-xs text-muted-foreground">Cobertura actual</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Chunks</CardTitle>
						<Layers className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
						<p className="text-xs text-muted-foreground">Chunks actuales</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Ahorro Potencial</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{Math.round(totalPotentialSavings / 1000 * 10) / 10}MB</div>
						<p className="text-xs text-muted-foreground">Con optimizaciones</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="metrics" className="space-y-4">
				<TabsList>
					<TabsTrigger value="metrics">Métricas Bundle</TabsTrigger>
					<TabsTrigger value="strategies">Estrategias</TabsTrigger>
					<TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
					<TabsTrigger value="implementation">Implementación</TabsTrigger>
				</TabsList>

				<TabsContent value="metrics" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5" />
								Métricas del Bundle
							</CardTitle>
							<CardDescription>
								Análisis detallado del tamaño y estructura del bundle
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{bundleMetrics.map((metric) => {
									const progress = Math.min((metric.current / metric.optimal) * 100, 100);
									return (
										<div key={metric.id} className="space-y-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div className={`w-3 h-3 rounded-full ${getStatusColor(metric.status)}`} />
													<span className="font-medium">{metric.name}</span>
													<Badge variant={getImpactColor(metric.impact)}>
														{metric.impact}
													</Badge>
												</div>
												<span className="text-sm text-muted-foreground">
													{metric.current}{metric.unit} / {metric.optimal}{metric.unit}
												</span>
											</div>
											<Progress value={progress} className="h-2" />
											<p className="text-sm text-muted-foreground">{metric.description}</p>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="strategies" className="space-y-4">
					<div className="grid gap-4">
						{strategies
							.sort((a, b) => a.priority - b.priority)
							.map((strategy) => (
							<Card key={strategy.id} className={strategy.implemented ? 'border-green-200 bg-green-50/50' : ''}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											{strategy.implemented ? (
												<CheckCircle className="h-5 w-5 text-green-600" />
											) : (
												<Code className="h-5 w-5 text-blue-600" />
											)}
											{strategy.title}
										</CardTitle>
										<div className="flex gap-2">
											<Badge variant="outline">
												Ahorro: {strategy.estimatedSavings}
											</Badge>
											<Badge variant={strategy.complexity === 'high' ? 'destructive' : strategy.complexity === 'medium' ? 'default' : 'secondary'}>
												{strategy.complexity}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground mb-3">{strategy.description}</p>
									<div className="space-y-2">
										<h5 className="font-medium text-sm">Beneficios:</h5>
										<ul className="space-y-1">
											{strategy.benefits.map((benefit, index) => (
												<li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
													<div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
													{benefit}
												</li>
											))}
										</ul>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="opportunities" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Target className="h-5 w-5" />
								Oportunidades de Lazy Loading
							</CardTitle>
							<CardDescription>
								Componentes que pueden beneficiarse de carga diferida
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{lazyLoadingOpportunities
									.sort((a, b) => {
										const priorityOrder = { high: 3, medium: 2, low: 1 };
										return priorityOrder[b.priority] - priorityOrder[a.priority];
									})
									.map((opportunity) => (
									<div key={opportunity.id} className={`p-4 rounded-lg border ${opportunity.implemented ? 'bg-green-50 border-green-200' : 'bg-background'}`}>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												{opportunity.implemented ? (
													<CheckCircle className="h-5 w-5 text-green-600" />
												) : (
													<Clock className="h-5 w-5 text-orange-600" />
												)}
												<h4 className="font-medium">{opportunity.component}</h4>
												<Badge variant={getPriorityColor(opportunity.priority)}>
													{opportunity.priority}
												</Badge>
											</div>
											<div className="text-sm text-muted-foreground">
												Ahorro: <span className="font-medium text-green-600">{opportunity.estimatedSavings}</span>
											</div>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">{opportunity.path}</span>
											<span className="text-muted-foreground">Tamaño: {opportunity.currentSize}</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="implementation" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Plan de Implementación</CardTitle>
							<CardDescription>
								Roadmap para optimización de división de código
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								<Alert>
									<Package className="h-4 w-4" />
									<AlertTitle>Estado Actual</AlertTitle>
									<AlertDescription>
										Next.js App Router implementado con división básica por rutas. 
										Se requiere optimización granular de componentes y vendors.
									</AlertDescription>
								</Alert>

								<div className="space-y-4">
									<h4 className="font-semibold flex items-center gap-2">
										<Zap className="h-4 w-4" />
										Fase 1: Lazy Loading Inmediato (1 semana)
									</h4>
									<ul className="space-y-2 ml-6">
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Implementar lazy loading en Dashboard Charts
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Optimizar carga del Admin Panel
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Diferir Settings Forms
										</li>
									</ul>

									<h4 className="font-semibold flex items-center gap-2">
										<Layers className="h-4 w-4" />
										Fase 2: Optimización de Vendors (2 semanas)
									</h4>
									<ul className="space-y-2 ml-6">
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Separar librerías por frecuencia de cambio
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Optimizar chunks de UI components
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Implementar preload inteligente
										</li>
									</ul>

									<h4 className="font-semibold flex items-center gap-2">
										<Code className="h-4 w-4" />
										Fase 3: División por Características (3 semanas)
									</h4>
									<ul className="space-y-2 ml-6">
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Agrupar por módulos funcionales
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Implementar carga contextual
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Optimizar tree shaking avanzado
										</li>
									</ul>
								</div>

								<div className="flex gap-2 pt-4">
									<Button className="flex-1">
										Iniciar Optimización
									</Button>
									<Button variant="outline">
										Analizar Bundle Actual
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default CodeSplittingReport;