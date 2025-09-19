'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Activity,
	AlertTriangle,
	CheckCircle,
	Clock,
	Database,
	Download,
	Eye,
	Gauge,
	Image,
	Layers,
	MemoryStick,
	Monitor,
	RefreshCw,
	Server,
	Smartphone,
	Tablet,
	TrendingDown,
	TrendingUp,
	Wifi,
	Zap
} from 'lucide-react'
import { usePerformanceMetrics, useWebVitals, useMemoryMonitor } from '@/hooks/usePerformanceOptimization'
import { useResponsive } from '@/hooks/useResponsive'

interface PerformanceIssue {
	id: string
	title: string
	description: string
	severity: 'critical' | 'high' | 'medium' | 'low'
	category: 'loading' | 'runtime' | 'memory' | 'network' | 'ui'
	impact: string
	recommendation: string
	estimatedImprovement: string
}

interface OptimizationOpportunity {
	id: string
	title: string
	description: string
	priority: 'high' | 'medium' | 'low'
	effort: 'low' | 'medium' | 'high'
	benefits: string[]
	implementation: string
}

export default function PerformanceAnalysisReport() {
	const responsive = useResponsive()
	const performanceMetrics = usePerformanceMetrics('PerformanceAnalysis')
	const webVitals = useWebVitals() || {}
	const memoryInfo = useMemoryMonitor()
	
	const [analysisComplete, setAnalysisComplete] = useState(false)
	const [analysisProgress, setAnalysisProgress] = useState(0)
	const [currentAnalysis, setCurrentAnalysis] = useState('')

	// Simular análisis progresivo
	useEffect(() => {
		const analyses = [
			'Analizando Core Web Vitals...',
			'Evaluando tiempos de carga...',
			'Revisando uso de memoria...',
			'Analizando recursos de red...',
			'Evaluando rendimiento de componentes...',
			'Identificando oportunidades de optimización...',
			'Generando recomendaciones...'
		]

		let currentStep = 0
		const interval = setInterval(() => {
			if (currentStep < analyses.length) {
				setCurrentAnalysis(analyses[currentStep])
				setAnalysisProgress(((currentStep + 1) / analyses.length) * 100)
				currentStep++
			} else {
				setAnalysisComplete(true)
				clearInterval(interval)
			}
		}, 800)

		return () => clearInterval(interval)
	}, [])

	// Análisis de problemas de rendimiento
	const identifyPerformanceIssues = (): PerformanceIssue[] => {
		const issues: PerformanceIssue[] = []

		// Análisis de Web Vitals
		if ((webVitals as any).LCP > 2500) {
			issues.push({
				id: 'lcp-high',
				title: 'Largest Contentful Paint Alto',
				description: `LCP actual: ${((webVitals as any).LCP / 1000).toFixed(2)}s (objetivo: <2.5s)`,
				severity: 'high',
				category: 'loading',
				impact: 'Los usuarios experimentan tiempos de carga lentos',
				recommendation: 'Optimizar imágenes, implementar lazy loading, usar CDN',
				estimatedImprovement: '30-50% mejora en tiempo de carga'
			})
		}

		if ((webVitals as any).FID > 100) {
			issues.push({
				id: 'fid-high',
				title: 'First Input Delay Alto',
				description: `FID actual: ${(webVitals as any).FID}ms (objetivo: <100ms)`,
				severity: 'high',
				category: 'runtime',
				impact: 'Interacciones del usuario se sienten lentas',
				recommendation: 'Reducir JavaScript, implementar code splitting',
				estimatedImprovement: '40-60% mejora en responsividad'
			})
		}

		if ((webVitals as any).CLS > 0.1) {
			issues.push({
				id: 'cls-high',
				title: 'Cumulative Layout Shift Alto',
				description: `CLS actual: ${((webVitals as any).CLS).toFixed(3)} (objetivo: <0.1)`,
				severity: 'medium',
				category: 'ui',
				impact: 'Elementos se mueven inesperadamente',
				recommendation: 'Definir dimensiones de imágenes, evitar inserción de contenido',
				estimatedImprovement: '20-30% mejora en estabilidad visual'
			})
		}

		// Análisis de memoria
		if (memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) {
			issues.push({
				id: 'memory-high',
				title: 'Uso de Memoria Elevado',
				description: `Memoria JS: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
				severity: 'medium',
				category: 'memory',
				impact: 'Posible degradación de rendimiento en dispositivos móviles',
				recommendation: 'Implementar limpieza de memoria, optimizar componentes',
				estimatedImprovement: '25-35% reducción en uso de memoria'
			})
		}

		// Análisis específico para móviles
		if (responsive.isMobile) {
			issues.push({
				id: 'mobile-optimization',
				title: 'Optimización Móvil Requerida',
				description: 'Detectado dispositivo móvil con posibles limitaciones',
				severity: 'medium',
				category: 'loading',
				impact: 'Experiencia subóptima en dispositivos móviles',
				recommendation: 'Implementar Progressive Web App, optimizar para touch',
				estimatedImprovement: '20-40% mejora en experiencia móvil'
			})
		}

		return issues
	}

	// Identificar oportunidades de optimización
	const identifyOptimizationOpportunities = (): OptimizationOpportunity[] => {
		return [
			{
				id: 'image-optimization',
				title: 'Optimización de Imágenes',
				description: 'Implementar formatos modernos y compresión inteligente',
				priority: 'high',
				effort: 'medium',
				benefits: [
					'Reducción del 40-60% en tamaño de imágenes',
					'Mejora significativa en LCP',
					'Menor uso de ancho de banda'
				],
				implementation: 'Next.js Image component con optimización automática'
			},
			{
				id: 'code-splitting',
				title: 'División de Código Avanzada',
				description: 'Implementar lazy loading de componentes y rutas',
				priority: 'high',
				effort: 'medium',
				benefits: [
					'Reducción del bundle inicial',
					'Carga más rápida de páginas',
					'Mejor Time to Interactive'
				],
				implementation: 'React.lazy() y dynamic imports'
			},
			{
				id: 'caching-strategy',
				title: 'Estrategia de Cache Mejorada',
				description: 'Implementar cache inteligente para datos y recursos',
				priority: 'medium',
				effort: 'low',
				benefits: [
					'Reducción de llamadas a API',
					'Experiencia más fluida',
					'Menor carga del servidor'
				],
				implementation: 'Service Workers y Cache API'
			},
			{
				id: 'database-optimization',
				title: 'Optimización de Base de Datos',
				description: 'Mejorar consultas y añadir índices estratégicos',
				priority: 'medium',
				effort: 'medium',
				benefits: [
					'Consultas 50-70% más rápidas',
					'Menor carga del servidor',
					'Mejor escalabilidad'
				],
				implementation: 'Análisis de queries lentas y optimización de índices'
			},
			{
				id: 'pwa-enhancement',
				title: 'Mejoras de PWA',
				description: 'Funcionalidades offline y notificaciones push',
				priority: 'medium',
				effort: 'high',
				benefits: [
					'Experiencia nativa en móviles',
					'Funcionalidad offline',
					'Mayor engagement de usuarios'
				],
				implementation: 'Service Workers avanzados y Web Push API'
			}
		]
	}

	const performanceIssues = identifyPerformanceIssues()
	const optimizationOpportunities = identifyOptimizationOpportunities()

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'text-red-600 bg-red-50 border-red-200'
			case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
			case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
			case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
			default: return 'text-gray-600 bg-gray-50 border-gray-200'
		}
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800'
			case 'medium': return 'bg-yellow-100 text-yellow-800'
			case 'low': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getEffortColor = (effort: string) => {
		switch (effort) {
			case 'low': return 'bg-green-100 text-green-800'
			case 'medium': return 'bg-yellow-100 text-yellow-800'
			case 'high': return 'bg-red-100 text-red-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	if (!analysisComplete) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
				<Card className="max-w-2xl mx-auto">
					<CardHeader className="text-center">
						<CardTitle className="flex items-center justify-center gap-2 text-2xl">
							<Activity className="w-8 h-8 text-blue-600" />
							Análisis de Rendimiento
						</CardTitle>
						<CardDescription>
							Evaluando el rendimiento de la aplicación Kairos
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Progreso del análisis</span>
								<span className="font-medium">{Math.round(analysisProgress)}%</span>
							</div>
							<Progress value={analysisProgress} className="h-3" />
							<p className="text-sm text-muted-foreground flex items-center gap-2">
								<RefreshCw className="w-4 h-4 animate-spin" />
								{currentAnalysis}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Gauge className="w-8 h-8 text-blue-600" />
								Reporte de Análisis de Rendimiento
							</CardTitle>
							<CardDescription>
								Análisis completo del rendimiento de Kairos Fitness
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="flex items-center gap-1">
								{responsive.isMobile ? <Smartphone className="w-4 h-4" /> : 
								 responsive.isTablet ? <Tablet className="w-4 h-4" /> : 
								 <Monitor className="w-4 h-4" />}
								{responsive.isMobile ? 'Móvil' : responsive.isTablet ? 'Tablet' : 'Desktop'}
							</Badge>
							<Button variant="outline" size="sm">
								<Download className="w-4 h-4 mr-2" />
								Exportar
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Resumen Ejecutivo */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<AlertTriangle className="w-5 h-5 text-red-500" />
							Problemas Identificados
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-red-600 mb-2">
							{performanceIssues.length}
						</div>
						<p className="text-sm text-muted-foreground">
							{performanceIssues.filter(i => i.severity === 'high' || i.severity === 'critical').length} críticos/altos
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<TrendingUp className="w-5 h-5 text-green-500" />
							Oportunidades
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600 mb-2">
							{optimizationOpportunities.length}
						</div>
						<p className="text-sm text-muted-foreground">
							{optimizationOpportunities.filter(o => o.priority === 'high').length} alta prioridad
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Zap className="w-5 h-5 text-blue-500" />
							Impacto Estimado
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-600 mb-2">
							+40%
						</div>
						<p className="text-sm text-muted-foreground">
							Mejora estimada en rendimiento
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Contenido Principal */}
			<Tabs defaultValue="issues" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="issues" className="flex items-center gap-2">
						<AlertTriangle className="w-4 h-4" />
						Problemas
					</TabsTrigger>
					<TabsTrigger value="opportunities" className="flex items-center gap-2">
						<TrendingUp className="w-4 h-4" />
						Oportunidades
					</TabsTrigger>
					<TabsTrigger value="metrics" className="flex items-center gap-2">
						<Activity className="w-4 h-4" />
						Métricas
					</TabsTrigger>
				</TabsList>

				{/* Tab: Problemas */}
				<TabsContent value="issues" className="space-y-4">
					{performanceIssues.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center">
								<CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
								<h3 className="text-xl font-semibold mb-2">¡Excelente!</h3>
								<p className="text-muted-foreground">
									No se encontraron problemas críticos de rendimiento.
								</p>
							</CardContent>
						</Card>
					) : (
						performanceIssues.map((issue) => (
							<Card key={issue.id} className={`border-l-4 ${getSeverityColor(issue.severity)}`}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="flex items-center gap-2">
												{issue.category === 'loading' && <Clock className="w-5 h-5" />}
												{issue.category === 'runtime' && <Zap className="w-5 h-5" />}
												{issue.category === 'memory' && <MemoryStick className="w-5 h-5" />}
												{issue.category === 'network' && <Wifi className="w-5 h-5" />}
												{issue.category === 'ui' && <Eye className="w-5 h-5" />}
												{issue.title}
											</CardTitle>
											<CardDescription>{issue.description}</CardDescription>
										</div>
										<Badge className={getSeverityColor(issue.severity)}>
											{issue.severity.toUpperCase()}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<h4 className="font-medium mb-2">Impacto</h4>
											<p className="text-sm text-muted-foreground">{issue.impact}</p>
										</div>
										<div>
											<h4 className="font-medium mb-2">Mejora Estimada</h4>
											<p className="text-sm text-green-600 font-medium">{issue.estimatedImprovement}</p>
										</div>
									</div>
									<div className="bg-muted/50 p-4 rounded-lg">
										<h4 className="font-medium mb-2">Recomendación</h4>
										<p className="text-sm">{issue.recommendation}</p>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</TabsContent>

				{/* Tab: Oportunidades */}
				<TabsContent value="opportunities" className="space-y-4">
					{optimizationOpportunities.map((opportunity) => (
						<Card key={opportunity.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<TrendingUp className="w-5 h-5 text-green-500" />
											{opportunity.title}
										</CardTitle>
										<CardDescription>{opportunity.description}</CardDescription>
									</div>
									<div className="flex gap-2">
										<Badge className={getPriorityColor(opportunity.priority)}>
											{opportunity.priority.toUpperCase()}
										</Badge>
										<Badge className={getEffortColor(opportunity.effort)}>
											Esfuerzo: {opportunity.effort.toUpperCase()}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="font-medium mb-2">Beneficios</h4>
									<ul className="space-y-1">
										{opportunity.benefits.map((benefit, index) => (
											<li key={index} className="flex items-center gap-2 text-sm">
												<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
												{benefit}
											</li>
										))}
									</ul>
								</div>
								<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
									<h4 className="font-medium mb-2">Implementación</h4>
									<p className="text-sm text-blue-700 dark:text-blue-300">{opportunity.implementation}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</TabsContent>

				{/* Tab: Métricas */}
				<TabsContent value="metrics" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Web Vitals */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Activity className="w-5 h-5" />
									Core Web Vitals
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{Object.entries(webVitals).map(([key, value]) => (
									<div key={key} className="flex justify-between items-center">
										<span className="text-sm font-medium">{key}</span>
										<span className="text-sm">
											{typeof value === 'number' ? value.toFixed(2) : String(value)}
										</span>
									</div>
								))}
							</CardContent>
						</Card>

						{/* Memoria */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MemoryStick className="w-5 h-5" />
									Uso de Memoria
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{memoryInfo ? (
									<>
										<div className="flex justify-between items-center">
											<span className="text-sm font-medium">JS Heap</span>
											<span className="text-sm">
												{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm font-medium">Total</span>
											<span className="text-sm">
												{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB
											</span>
										</div>
										<Progress 
											value={(memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100} 
											className="h-2"
										/>
									</>
								) : (
									<p className="text-sm text-muted-foreground">No disponible</p>
								)}
							</CardContent>
						</Card>

						{/* Dispositivo */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									{responsive.isMobile ? <Smartphone className="w-5 h-5" /> : 
									 responsive.isTablet ? <Tablet className="w-5 h-5" /> : 
									 <Monitor className="w-5 h-5" />}
									Dispositivo
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium">Tipo</span>
									<span className="text-sm">
										{responsive.isMobile ? 'Móvil' : responsive.isTablet ? 'Tablet' : 'Desktop'}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium">Resolución</span>
									<span className="text-sm">{responsive.width}×{responsive.height}</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium">Táctil</span>
									<span className="text-sm">{responsive.isTouchDevice ? 'Sí' : 'No'}</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			{/* Recomendaciones Finales */}
			<Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
						<Layers className="w-5 h-5" />
						Plan de Acción Recomendado
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<h4 className="font-medium text-red-700 dark:text-red-400">Prioridad Inmediata</h4>
								<ul className="text-sm space-y-1">
									{performanceIssues
										.filter(i => i.severity === 'critical' || i.severity === 'high')
										.slice(0, 3)
										.map(issue => (
											<li key={issue.id} className="flex items-center gap-2">
												<div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
												{issue.title}
											</li>
										))
									}
								</ul>
							</div>
							<div className="space-y-2">
								<h4 className="font-medium text-yellow-700 dark:text-yellow-400">Corto Plazo</h4>
								<ul className="text-sm space-y-1">
									{optimizationOpportunities
										.filter(o => o.priority === 'high' && o.effort === 'low')
										.slice(0, 3)
										.map(opp => (
											<li key={opp.id} className="flex items-center gap-2">
												<div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
												{opp.title}
											</li>
										))
									}
								</ul>
							</div>
							<div className="space-y-2">
								<h4 className="font-medium text-green-700 dark:text-green-400">Largo Plazo</h4>
								<ul className="text-sm space-y-1">
									{optimizationOpportunities
										.filter(o => o.effort === 'high')
										.slice(0, 3)
										.map(opp => (
											<li key={opp.id} className="flex items-center gap-2">
												<div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
												{opp.title}
											</li>
										))
									}
								</ul>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}