'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Image, Zap, Target, TrendingUp, FileImage, Smartphone, Monitor, Globe } from 'lucide-react';

interface ImageOptimizationMetric {
	id: string;
	name: string;
	current: number;
	optimal: number;
	unit: string;
	status: 'good' | 'warning' | 'critical';
	impact: 'high' | 'medium' | 'low';
}

interface OptimizationRecommendation {
	id: string;
	title: string;
	description: string;
	impact: 'high' | 'medium' | 'low';
	effort: 'low' | 'medium' | 'high';
	implemented: boolean;
	priority: number;
}

const ImageOptimizationReport: React.FC = () => {
	const metrics: ImageOptimizationMetric[] = [
		{
			id: 'format-support',
			name: 'Formatos Modernos (WebP/AVIF)',
			current: 85,
			optimal: 95,
			unit: '%',
			status: 'good',
			impact: 'high'
		},
		{
			id: 'compression-ratio',
			name: 'Ratio de Compresión',
			current: 72,
			optimal: 85,
			unit: '%',
			status: 'warning',
			impact: 'high'
		},
		{
			id: 'lazy-loading',
			name: 'Lazy Loading Coverage',
			current: 90,
			optimal: 98,
			unit: '%',
			status: 'good',
			impact: 'medium'
		},
		{
			id: 'responsive-images',
			name: 'Imágenes Responsivas',
			current: 78,
			optimal: 95,
			unit: '%',
			status: 'warning',
			impact: 'high'
		},
		{
			id: 'cache-efficiency',
			name: 'Eficiencia de Cache',
			current: 88,
			optimal: 95,
			unit: '%',
			status: 'good',
			impact: 'medium'
		},
		{
			id: 'cdn-usage',
			name: 'Uso de CDN',
			current: 65,
			optimal: 90,
			unit: '%',
			status: 'warning',
			impact: 'high'
		}
	];

	const recommendations: OptimizationRecommendation[] = [
		{
			id: 'implement-avif',
			title: 'Implementar soporte completo para AVIF',
			description: 'AVIF ofrece hasta 50% mejor compresión que WebP manteniendo la calidad visual.',
			impact: 'high',
			effort: 'medium',
			implemented: false,
			priority: 1
		},
		{
			id: 'optimize-compression',
			title: 'Optimizar algoritmos de compresión',
			description: 'Implementar compresión adaptativa basada en contenido y dispositivo.',
			impact: 'high',
			effort: 'high',
			implemented: false,
			priority: 2
		},
		{
			id: 'enhance-responsive',
			title: 'Mejorar sistema de imágenes responsivas',
			description: 'Implementar srcset dinámico con más breakpoints y densidades.',
			impact: 'high',
			effort: 'medium',
			implemented: true,
			priority: 3
		},
		{
			id: 'implement-cdn',
			title: 'Integrar CDN especializado en imágenes',
			description: 'Usar servicios como Cloudinary o ImageKit para optimización automática.',
			impact: 'high',
			effort: 'medium',
			implemented: false,
			priority: 4
		},
		{
			id: 'progressive-loading',
			title: 'Implementar carga progresiva',
			description: 'Mostrar versiones de baja calidad mientras se cargan las imágenes completas.',
			impact: 'medium',
			effort: 'medium',
			implemented: true,
			priority: 5
		},
		{
			id: 'smart-preloading',
			title: 'Preload inteligente de imágenes críticas',
			description: 'Precargar imágenes above-the-fold y predecir navegación del usuario.',
			impact: 'medium',
			effort: 'low',
			implemented: false,
			priority: 6
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

	const overallScore = Math.round(metrics.reduce((acc, metric) => acc + (metric.current / metric.optimal) * 100, 0) / metrics.length);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Optimización de Imágenes</h1>
					<p className="text-muted-foreground mt-2">
						Análisis completo del rendimiento y optimización de imágenes
					</p>
				</div>
				<Badge variant={overallScore >= 85 ? 'default' : overallScore >= 70 ? 'secondary' : 'destructive'} className="text-lg px-4 py-2">
					Puntuación: {overallScore}%
				</Badge>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Formatos Modernos</CardTitle>
						<FileImage className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">85%</div>
						<p className="text-xs text-muted-foreground">WebP/AVIF implementado</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Compresión</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">72%</div>
						<p className="text-xs text-muted-foreground">Ratio de optimización</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Lazy Loading</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">90%</div>
						<p className="text-xs text-muted-foreground">Cobertura implementada</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">CDN Usage</CardTitle>
						<Globe className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">65%</div>
						<p className="text-xs text-muted-foreground">Distribución global</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="metrics" className="space-y-4">
				<TabsList>
					<TabsTrigger value="metrics">Métricas Detalladas</TabsTrigger>
					<TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
					<TabsTrigger value="implementation">Plan de Implementación</TabsTrigger>
				</TabsList>

				<TabsContent value="metrics" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5" />
								Métricas de Optimización
							</CardTitle>
							<CardDescription>
								Análisis detallado del rendimiento actual vs. objetivos
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{metrics.map((metric) => (
									<div key={metric.id} className="space-y-2">
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
										<Progress 
											value={(metric.current / metric.optimal) * 100} 
											className="h-2"
										/>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="recommendations" className="space-y-4">
					<div className="grid gap-4">
						{recommendations
							.sort((a, b) => a.priority - b.priority)
							.map((rec) => (
							<Card key={rec.id} className={rec.implemented ? 'border-green-200 bg-green-50/50' : ''}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											{rec.implemented ? (
												<CheckCircle className="h-5 w-5 text-green-600" />
											) : (
												<AlertTriangle className="h-5 w-5 text-yellow-600" />
											)}
											{rec.title}
										</CardTitle>
										<div className="flex gap-2">
											<Badge variant={getImpactColor(rec.impact)}>
												Impacto: {rec.impact}
											</Badge>
											<Badge variant="outline">
												Esfuerzo: {rec.effort}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">{rec.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="implementation" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Plan de Implementación</CardTitle>
							<CardDescription>
								Roadmap detallado para optimización de imágenes
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								<Alert>
									<Image className="h-4 w-4" />
									<AlertTitle>Estado Actual</AlertTitle>
									<AlertDescription>
										Se ha implementado un sistema básico de optimización con Next.js Image, 
										soporte para WebP/AVIF y lazy loading. Se requieren mejoras en compresión y CDN.
									</AlertDescription>
								</Alert>

								<div className="space-y-4">
									<h4 className="font-semibold flex items-center gap-2">
										<Smartphone className="h-4 w-4" />
										Fase 1: Optimización Inmediata (1-2 semanas)
									</h4>
									<ul className="space-y-2 ml-6">
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-600" />
											Implementar preload inteligente para imágenes críticas
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Optimizar configuración de compresión existente
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Mejorar srcset para más breakpoints
										</li>
									</ul>

									<h4 className="font-semibold flex items-center gap-2">
										<Monitor className="h-4 w-4" />
										Fase 2: Integración CDN (2-3 semanas)
									</h4>
									<ul className="space-y-2 ml-6">
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Integrar CDN especializado (Cloudinary/ImageKit)
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Implementar transformaciones automáticas
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Configurar cache global optimizado
										</li>
									</ul>

									<h4 className="font-semibold flex items-center gap-2">
										<Globe className="h-4 w-4" />
										Fase 3: Optimización Avanzada (3-4 semanas)
									</h4>
									<ul className="space-y-2 ml-6">
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Implementar soporte completo AVIF
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Compresión adaptativa por contenido
										</li>
										<li className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-yellow-600" />
											Análisis automático de performance
										</li>
									</ul>
								</div>

								<div className="flex gap-2 pt-4">
									<Button className="flex-1">
										Iniciar Implementación
									</Button>
									<Button variant="outline">
										Descargar Plan Detallado
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

export default ImageOptimizationReport;